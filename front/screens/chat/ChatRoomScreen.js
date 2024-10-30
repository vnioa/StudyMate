// ChatRoomScreen.js
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWindowDimensions, Platform, Animated, PanResponder } from 'react-native';
import { useAccessibilityInfo } from '@react-native-community/hooks';
import io from 'socket.io-client';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { manipulateAsync } from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { encryptMessage, decryptMessage } from '../utils/encryption';

const API_URL = 'YOUR_API_URL';
const socket = io('YOUR_WEBSOCKET_URL');
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ChatRoomScreen = () => {
    // Navigation & Route
    const navigation = useNavigation();
    const route = useRoute();
    const { chatId } = route.params;

    // States
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [inputHeight, setInputHeight] = useState(50);
    const [isTyping, setIsTyping] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [encryptionKey, setEncryptionKey] = useState(null);

    // Refs
    const listRef = useRef(null);
    const recordingRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const inputAnimation = useRef(new Animated.Value(50)).current;
    const reactionScale = useRef(new Animated.Value(1)).current;

    // Query Client
    const queryClient = useQueryClient();

    // Accessibility
    const { isScreenReaderEnabled, reduceMotionEnabled } = useAccessibilityInfo();

    // Messages Query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['messages', chatId],
        queryFn: async ({ pageParam = null }) => {
            const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
                params: {
                    lastMessageId: pageParam,
                    limit: 50
                }
            });
            const messages = response.data.messages;
            // 메시지 복호화
            const decryptedMessages = await Promise.all(
                messages.map(async msg => ({
                    ...msg,
                    content: await decryptMessage(msg.content, encryptionKey)
                }))
            );
            return {
                messages: decryptedMessages,
                nextPage: response.data.hasMore ? messages[messages.length - 1].id : null
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage
    });

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ content, type, replyTo = null, attachments = [] }) => {
            // 메시지 암호화
            const encryptedContent = await encryptMessage(content, encryptionKey);

            const formData = new FormData();
            formData.append('content', encryptedContent);
            formData.append('type', type);
            if (replyTo) formData.append('replyTo', replyTo);

            attachments.forEach((attachment, index) => {
                formData.append(`attachment${index}`, {
                    uri: attachment.uri,
                    type: attachment.type,
                    name: attachment.name
                });
            });

            const response = await axios.post(
                `${API_URL}/chats/${chatId}/messages`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        },
        onSuccess: (newMessage) => {
            queryClient.setQueryData(['messages', chatId], (old) => ({
                ...old,
                pages: [
                    {
                        ...old.pages[0],
                        messages: [newMessage, ...old.pages[0].messages]
                    },
                    ...old.pages.slice(1)
                ]
            }));
        }
    });

    // WebSocket Connection
    useEffect(() => {
        socket.emit('join_room', chatId);

        socket.on('new_message', handleNewMessage);
        socket.on('message_read', handleMessageRead);
        socket.on('user_typing', handleUserTyping);
        socket.on('reaction_added', handleReactionAdded);

        return () => {
            socket.emit('leave_room', chatId);
            socket.off('new_message');
            socket.off('message_read');
            socket.off('user_typing');
            socket.off('reaction_added');
        };
    }, [chatId]);

    // Encryption Setup
    useEffect(() => {
        async function setupEncryption() {
            const key = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                chatId
            );
            setEncryptionKey(key);
        }
        setupEncryption();
    }, [chatId]);

    // Message Handlers
    const handleNewMessage = useCallback(async (message) => {
        const decryptedContent = await decryptMessage(message.content, encryptionKey);
        queryClient.setQueryData(['messages', chatId], (old) => ({
            ...old,
            pages: [
                {
                    ...old.pages[0],
                    messages: [{ ...message, content: decryptedContent }, ...old.pages[0].messages]
                },
                ...old.pages.slice(1)
            ]
        }));

        // 자동 스크롤
        if (!reduceMotionEnabled && isNearBottom()) {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }, [encryptionKey, reduceMotionEnabled]);

    // File Upload Handlers
    const handleImageUpload = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true
        });

        if (!result.canceled) {
            const image = result.assets[0];
            if (image.fileSize > MAX_IMAGE_SIZE) {
                // 이미지 압축
                const compressedImage = await manipulateAsync(
                    image.uri,
                    [{ resize: { width: 1024 } }],
                    { compress: 0.7 }
                );
                await sendMessageMutation.mutateAsync({
                    type: 'IMAGE',
                    attachments: [compressedImage]
                });
            } else {
                await sendMessageMutation.mutateAsync({
                    type: 'IMAGE',
                    attachments: [image]
                });
            }
        }
    }, []);

    // Voice Message Handlers
    const startRecording = useCallback(async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true
            });

            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            await recording.startAsync();

            recordingRef.current = recording;
            setIsRecording(true);

            // 녹음 시간 카운터
            const interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            recordingRef.current.interval = interval;
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }, []);

    const stopRecording = useCallback(async () => {
        try {
            await recordingRef.current.stopAndUnloadAsync();
            clearInterval(recordingRef.current.interval);

            const uri = recordingRef.current.getURI();
            await sendMessageMutation.mutateAsync({
                type: 'VOICE',
                attachments: [{ uri, type: 'audio/m4a', name: 'voice-message.m4a' }]
            });

            setIsRecording(false);
            setRecordingTime(0);
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    }, []);

    // Typing Indicator
    const handleTyping = useCallback((text) => {
        setMessage(text);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        socket.emit('typing_start', chatId);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', chatId);
        }, 1000);
    }, [chatId]);

    // Message Reactions
    const handleDoubleTap = useCallback((messageId) => {
        if (!reduceMotionEnabled) {
            Animated.sequence([
                Animated.spring(reactionScale, {
                    toValue: 1.5,
                    useNativeDriver: true
                }),
                Animated.spring(reactionScale, {
                    toValue: 1,
                    useNativeDriver: true
                })
            ]).start();
        }

        socket.emit('add_reaction', {
            chatId,
            messageId,
            reaction: '❤️'
        });
    }, [chatId, reduceMotionEnabled]);

    // Gesture Handlers
    const messageSwipeHandler = useMemo(() =>
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, { dx }) => {
                return Math.abs(dx) > 20;
            },
            onPanResponderMove: (_, { dx }) => {
                if (dx > 50) {
                    setReplyingTo(selectedMessages[0]);
                }
            },
            onPanResponderRelease: () => {
                Animated.spring(swipeAnim, {
                    toValue: 0,
                    useNativeDriver: true
                }).start();
            }
        }), []);

    // Performance Optimization
    const renderItem = useCallback(({ item }) => (
        <MessageItem
            message={item}
            isSelected={selectedMessages.has(item.id)}
            onLongPress={() => handleMessageLongPress(item.id)}
            onDoubleTap={() => handleDoubleTap(item.id)}
            panHandlers={messageSwipeHandler.panHandlers}
            isScreenReaderEnabled={isScreenReaderEnabled}
        />
    ), [selectedMessages, messageSwipeHandler, isScreenReaderEnabled]);

    return (
        <SafeAreaView style={styles.container}>
            {/* 상단 헤더 */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        shadowOpacity: scrollY.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, 0.3],
                            extrapolate: 'clamp'
                        })
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityLabel="뒤로 가기"
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.profileContainer}
                    onPress={() => navigation.navigate('Profile', { userId: chat.userId })}
                    accessibilityLabel={`${chat.name}의 프로필 보기`}
                >
                    <Image
                        source={{ uri: chat.profileImage }}
                        style={styles.profileImage}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{chat.name}</Text>
                        {isTyping && (
                            <Text style={styles.typingText}>입력 중...</Text>
                        )}
                    </View>
                </TouchableOpacity>

                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => navigation.navigate('Call', { chatId, type: 'VOICE' })}
                        accessibilityLabel="음성 통화"
                    >
                        <Icon name="phone" size={24} color="#4A90E2" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.videoCallButton}
                        onPress={() => navigation.navigate('Call', { chatId, type: 'VIDEO' })}
                        accessibilityLabel="영상 통화"
                    >
                        <Icon name="video" size={24} color="#4A90E2" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => navigation.navigate('ChatSettings', { chatId })}
                        accessibilityLabel="채팅방 설정"
                    >
                        <Icon name="dots-vertical" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* 메시지 목록 */}
            <FlashList
                ref={listRef}
                data={data?.pages.flatMap(page => page.messages) || []}
                renderItem={renderItem}
                estimatedItemSize={80}
                inverted
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>메시지가 없습니다</Text>
                    </View>
                }
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
            />

            {/* 답장 모드 */}
            {replyingTo && (
                <Animated.View
                    style={[
                        styles.replyContainer,
                        {
                            transform: [{
                                translateY: replyAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0]
                                })
                            }]
                        }
                    ]}
                >
                    <View style={styles.replyContent}>
                        <Text style={styles.replyName}>{replyingTo.userName}</Text>
                        <Text style={styles.replyText} numberOfLines={1}>
                            {replyingTo.content}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.closeReplyButton}
                        onPress={() => setReplyingTo(null)}
                    >
                        <Icon name="close" size={20} color="#999" />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* 입력창 */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
                <Animated.View
                    style={[
                        styles.inputContainer,
                        { height: inputAnimation }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.attachButton}
                        onPress={handleImageUpload}
                        accessibilityLabel="파일 첨부"
                    >
                        <Icon name="paperclip" size={24} color="#757575" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.emojiButton}
                        onPress={() => setEmojiPickerVisible(true)}
                        accessibilityLabel="이모티콘"
                    >
                        <Icon name="emoticon" size={24} color="#757575" />
                    </TouchableOpacity>

                    <TextInput
                        style={[
                            styles.input,
                            { height: Math.min(150, inputHeight) }
                        ]}
                        placeholder="메시지를 입력하세요"
                        value={message}
                        onChangeText={handleTyping}
                        multiline
                        onContentSizeChange={(e) =>
                            setInputHeight(e.nativeEvent.contentSize.height)
                        }
                    />

                    {message.length > 0 ? (
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={() => sendMessageMutation.mutate({ content: message })}
                            accessibilityLabel="메시지 보내기"
                        >
                            <Icon name="send" size={24} color="#4A90E2" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.voiceButton}
                            onPressIn={startRecording}
                            onPressOut={stopRecording}
                            accessibilityLabel="음성 메시지 녹음"
                        >
                            <Icon
                                name={isRecording ? "stop" : "microphone"}
                                size={24}
                                color={isRecording ? "#F44336" : "#757575"}
                            />
                            {isRecording && (
                                <Text style={styles.recordingTime}>
                                    {formatDuration(recordingTime)}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>

            {/* 이모지 피커 모달 */}
            <Modal
                visible={emojiPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEmojiPickerVisible(false)}
            >
                <EmojiPicker
                    onEmojiSelected={(emoji) => {
                        setMessage(prev => prev + emoji);
                        setEmojiPickerVisible(false);
                    }}
                    onClose={() => setEmojiPickerVisible(false)}
                />
            </Modal>

            {/* 이미지 뷰어 모달 */}
            <Modal
                visible={imageViewerVisible}
                transparent={true}
                onRequestClose={() => setImageViewerVisible(false)}
            >
                <ImageViewer
                    imageUrls={[{ url: selectedImage }]}
                    enableSwipeDown
                    onSwipeDown={() => setImageViewerVisible(false)}
                    renderIndicator={() => null}
                    backgroundColor="rgba(0, 0, 0, 0.9)"
                    renderHeader={() => (
                        <TouchableOpacity
                            style={styles.closeImageButton}
                            onPress={() => setImageViewerVisible(false)}
                        >
                            <Icon name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    )}
                />
            </Modal>

            {/* 메시지 옵션 모달 */}
            <Modal
                visible={!!selectedMessage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedMessage(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setSelectedMessage(null)}
                >
                    <View style={styles.messageOptions}>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={handleMessageCopy}
                        >
                            <Icon name="content-copy" size={24} color="#333" />
                            <Text style={styles.optionText}>복사</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={handleMessageForward}
                        >
                            <Icon name="share" size={24} color="#333" />
                            <Text style={styles.optionText}>전달</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={handleMessageReply}
                        >
                            <Icon name="reply" size={24} color="#333" />
                            <Text style={styles.optionText}>답장</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionButton, styles.deleteButton]}
                            onPress={handleMessageDelete}
                        >
                            <Icon name="delete" size={24} color="#F44336" />
                            <Text style={[styles.optionText, styles.deleteText]}>삭제</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    // 헤더 스타일
    header: {
        height: Platform.OS === 'ios' ? 88 : 64,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
        zIndex: 100
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20
    },
    profileContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20
    },
    profileInfo: {
        marginLeft: 12,
        flex: 1
    },
    userName: {
        fontSize: 16,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333'
    },
    typingText: {
        fontSize: 12,
        fontFamily: 'SFProText-Regular',
        color: '#4A90E2'
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    callButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    videoCallButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },

    // 메시지 목록 스타일
    messageList: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100
    },
    emptyText: {
        fontSize: 16,
        color: '#757575',
        fontFamily: 'SFProText-Regular'
    },

    // 메시지 버블 스타일
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 20,
        marginVertical: 4
    },
    sentMessage: {
        backgroundColor: '#E8F5E9',
        alignSelf: 'flex-end',
        marginLeft: '25%',
        borderTopRightRadius: 4
    },
    receivedMessage: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        marginRight: '25%',
        borderTopLeftRadius: 4
    },
    messageText: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        lineHeight: 20
    },
    messageTime: {
        fontSize: 12,
        fontFamily: 'SFProText-Light',
        color: '#757575',
        marginTop: 4,
        alignSelf: 'flex-end'
    },
    messageStatus: {
        fontSize: 12,
        fontFamily: 'SFProText-Regular',
        color: '#4A90E2',
        marginTop: 2
    },

    // 답장 모드 스타일
    replyContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center'
    },
    replyContent: {
        flex: 1,
        marginLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: '#4A90E2',
        paddingLeft: 8
    },
    replyName: {
        fontSize: 14,
        fontFamily: 'SFProText-Medium',
        color: '#4A90E2'
    },
    replyText: {
        fontSize: 12,
        fontFamily: 'SFProText-Regular',
        color: '#757575'
    },
    closeReplyButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // 입력창 스타일
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 50,
        maxHeight: 150
    },
    attachButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    emojiButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    input: {
        flex: 1,
        marginHorizontal: 8,
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        minHeight: 40
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    voiceButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    recordingTime: {
        position: 'absolute',
        bottom: -20,
        fontSize: 12,
        fontFamily: 'SFProText-Regular',
        color: '#F44336'
    },

    // 모달 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    messageOptions: {
        width: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    optionText: {
        marginLeft: 12,
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333'
    },
    deleteButton: {
        borderBottomWidth: 0
    },
    deleteText: {
        color: '#F44336'
    },

    // 이미지 뷰어 스타일
    imageViewer: {
        flex: 1,
        backgroundColor: '#000000'
    },
    closeImageButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : 20,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
    },

    // 애니메이션 관련 스타일
    messageAnimation: {
        transform: [{ scale: 1 }]
    },
    reactionAnimation: {
        position: 'absolute',
        right: -10,
        bottom: -10
    },

    // 접근성 관련 스타일
    highContrast: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#000000'
    },
    largeText: {
        fontSize: 20,
        lineHeight: 28
    },

    // 분할 보기 스타일
    splitViewContainer: {
        flexDirection: 'row'
    },
    splitViewDivider: {
        width: 1,
        backgroundColor: '#E0E0E0'
    }
});
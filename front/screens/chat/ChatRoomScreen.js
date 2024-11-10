// ChatRoomScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView,
    Animated,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import { GestureHandlerRootView, Swipeable, PinchGestureHandler, State } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Voice from '@react-native-voice/voice';
import { Video } from 'expo-av';
import Modal from 'react-native-modal';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import ImageViewer from 'react-native-image-zoom-viewer';
import EmojiSelector from 'react-native-emoji-selector';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const MAX_INPUT_HEIGHT = 150;
const MESSAGE_WIDTH_PERCENTAGE = 0.75;

const ChatRoomScreen = () => {
    // State 관리
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [inputHeight, setInputHeight] = useState(50);
    const [isRecording, setIsRecording] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isReplying, setIsReplying] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [scale, setScale] = useState(new Animated.Value(1));
    const [lastTap, setLastTap] = useState(null);
    const [showReaction, setShowReaction] = useState(false);
    const [reactionPosition, setReactionPosition] = useState({x: 0, y: 0});

    // Refs
    const flatListRef = useRef(null);
    const inputRef = useRef(null);
    const recordingAnimation = useRef(new Animated.Value(1)).current;
    const swipeableRefs = useRef({});
    const pinchRef = useRef();
    const typingTimeoutRef = useRef(null);
    const messageOptionsRef = useRef(null);

    // Navigation & Route
    const navigation = useNavigation();
    const route = useRoute();
    const {chatId, recipientId} = route.params;

    // Animations
    const messageInputAnimation = useRef(new Animated.Value(50)).current;
    const reactionAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        initializeChat();
        setupVoiceRecognition();
        setupKeyboardListeners();
        loadMessages();

        return () => {
            cleanup();
        };
    }, []);

    const initializeChat = async () => {
        try {
            setIsLoading(true);
            // 채팅방 초기화 로직
            await Promise.all([
                requestPermissions(),
                loadChatDetails(),
                setupWebSocket()
            ]);
        } catch (error) {
            setError('채팅방을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const {status: cameraStatus} = await ImagePicker.requestCameraPermissionsAsync();
            const {status: libraryStatus} = await ImagePicker.requestMediaLibraryPermissionsAsync();
            const {status: audioStatus} = await Voice.requestPermissionsAsync();

            if (cameraStatus !== 'granted' || libraryStatus !== 'granted' || audioStatus !== 'granted') {
                setError('앱 사용을 위해 필요한 권한이 없습니다.');
            }
        }
    };

    const loadChatDetails = async () => {
        try {
            const response = await fetch(`YOUR_API_ENDPOINT/chats/${chatId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error('채팅방 정보를 불러오는데 실패했습니다.');
            }

            // 채팅방 정보 설정
        } catch (error) {
            setError(error.message);
        }
    };

    const setupWebSocket = () => {
        const ws = new WebSocket('YOUR_WEBSOCKET_ENDPOINT');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onerror = (error) => {
            setError('실시간 메시지 연결에 실패했습니다.');
        };

        return () => {
            ws.close();
        };
    };

    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'NEW_MESSAGE':
                handleNewMessage(data.message);
                break;
            case 'TYPING':
                handleTypingIndicator(data);
                break;
            case 'READ_RECEIPT':
                updateMessageReadStatus(data);
                break;
            default:
                break;
        }
    };

    const loadMessages = async () => {
        try {
            const response = await fetch(`YOUR_API_ENDPOINT/messages/${chatId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error('메시지를 불러오는데 실패했습니다.');
            }

            setMessages(data);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({animated: false});
            }, 100);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleNewMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);

        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({animated: true});
        }

        // 새 메시지 알림 효과
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const handleSendMessage = useCallback(async () => {
        if (!inputText.trim() && !replyToMessage) return;

        try {
            const newMessage = {
                id: Date.now().toString(),
                text: inputText.trim(),
                timestamp: new Date(),
                senderId: 'currentUserId', // 실제 사용자 ID로 대체
                replyTo: replyToMessage,
                status: 'sending'
            };

            setMessages(prev => [...prev, newMessage]);
            setInputText('');
            setInputHeight(50);
            setReplyToMessage(null);

            // 메시지 전송 애니메이션
            Animated.sequence([
                Animated.timing(messageInputAnimation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(messageInputAnimation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start();

            // 서버로 메시지 전송
            const response = await fetch('YOUR_API_ENDPOINT/messages', {
                method: 'POST',
                body: JSON.stringify(newMessage)
            });

            if (!response.ok) {
                throw new Error('메시지 전송에 실패했습니다.');
            }

            // 전송 성공 시 메시지 상태 업데이트
            const updatedMessage = {...newMessage, status: 'sent'};
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === newMessage.id ? updatedMessage : msg
                )
            );

            flatListRef.current?.scrollToEnd({animated: true});
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // 메시지 전송 실패 처리
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === newMessage.id ? {...msg, status: 'failed'} : msg
                )
            );
            setError('메시지 전송에 실패했습니다.');
        }
    }, [inputText, replyToMessage]);

    const handleAttachment = useCallback(async () => {
        setShowAttachmentOptions(true);
    }, []);

    const handleImagePicker = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                await sendMediaMessage({
                    type: 'image',
                    uri: asset.uri,
                    width: asset.width,
                    height: asset.height
                });
            }
        } catch (error) {
            setError('이미지 선택에 실패했습니다.');
        } finally {
            setShowAttachmentOptions(false);
        }
    }, []);

    const handleDocumentPicker = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                await sendMediaMessage({
                    type: 'file',
                    uri: result.uri,
                    name: result.name,
                    size: result.size
                });
            }
        } catch (error) {
            setError('파일 선택에 실패했습니다.');
        } finally {
            setShowAttachmentOptions(false);
        }
    }, []);

    const sendMediaMessage = async (mediaData) => {
        try {
            const formData = new FormData();
            formData.append('media', {
                uri: mediaData.uri,
                type: mediaData.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
                name: mediaData.name || 'media'
            });

            const response = await fetch('YOUR_API_ENDPOINT/media', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('미디어 업로드에 실패했습니다.');
            }

            const {mediaUrl} = await response.json();

            const newMessage = {
                id: Date.now().toString(),
                type: mediaData.type,
                url: mediaUrl,
                timestamp: new Date(),
                senderId: 'currentUserId',
                status: 'sent'
            };

            setMessages(prev => [...prev, newMessage]);
            flatListRef.current?.scrollToEnd({animated: true});
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            setError('미디어 메시지 전송에 실패했습니다.');
        }
    };

    const handleVoiceRecord = useCallback(async () => {
        try {
            if (isRecording) {
                await Voice.stop();
                setIsRecording(false);
            } else {
                await Voice.start('ko-KR');
                setIsRecording(true);
                startRecordingAnimation();
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            setError('음성 녹음에 실패했습니다.');
            setIsRecording(false);
        }
    }, [isRecording]);

    const startRecordingAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(recordingAnimation, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(recordingAnimation, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const handleMessageLongPress = useCallback((message) => {
        setSelectedMessage(message);
        setShowOptionsModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, []);

    const handleMessageDoubleTap = useCallback((message, event) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
            // 더블 탭 처리
            const {pageX, pageY} = event.nativeEvent;
            setReactionPosition({x: pageX, y: pageY});
            setShowReaction(true);
            animateReaction();
        }
        setLastTap(now);
    }, [lastTap]);

    const animateReaction = () => {
        reactionAnimation.setValue(0);
        Animated.spring(reactionAnimation, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true
        }).start(() => {
            setTimeout(() => {
                setShowReaction(false);
            }, 1000);
        });
    };

    const renderMessage = useCallback(({item: message}) => {
        const isOwnMessage = message.senderId === 'currentUserId';

        return (
            <Swipeable
                ref={ref => swipeableRefs.current[message.id] = ref}
                renderLeftActions={(progress, dragX) => renderMessageActions(progress, dragX, message)}
                onSwipeableOpen={() => handleMessageSwipe(message)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onLongPress={() => handleMessageLongPress(message)}
                    onPress={(event) => handleMessageDoubleTap(message, event)}
                >
                    <View style={[
                        styles.messageContainer,
                        isOwnMessage ? styles.sendMessage : styles.receivedMessage,
                        isSelected && styles.selectedMessage
                    ]}
                    >
                        {message.replyTo && (
                            <View style={styles.replyContainer}>
                                <Text style={styles.replyText}>
                                    회신: {message.replyTo.text.substring(0, 30)}
                                    {message.replyTo.text.length > 30 ? '...' : ''}
                                </Text>
                            </View>
                        )}
                        {renderMessageContent(message)}
                        <View style={styles.messageFooter}>
                            <Text style={styles.timestamp}>
                                {formatTimestamp(message.timestamp)}
                            </Text>
                            {isOwnMessage && (
                                <MaterialIcons
                                    name={message.status === 'read' ? 'done-all' : 'done'}
                                    size={16}
                                    color={message.status === 'read' ? '#4A90E2' : '#757575'}
                                />
                            )}
                        </View>
                        {showReaction && (
                            <Animated.View
                                style={[
                                    styles.reactionContainer,
                                    {
                                        transform: [
                                            {scale: reactionAnimation},
                                            {
                                                translateY: reactionAnimation.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [10, -10]
                                                })
                                            },
                                        ]
                                    }
                                ]}
                            >
                                <Text style={styles.reactionEmoji}>❤️</Text>
                            </Animated.View>
                        )}
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    }, [selectedMessage, showReaction, reactionAnimation]);

    const renderMessageActions = useCallback((progress, dragX, message) => {
        const scale = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.messageActions}>
                <TouchableOpacity
                    style={[styles.messageAction, styles.replyAction]}
                    onPress={() => handleReply(message)}
                >
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <MaterialIcons name="reply" size={24} color="#FFFFFF" />
                    </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.messageAction, styles.deleteAction]}
                    onPress={() => handleDeleteMessage(message.id)}
                >
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <MaterialIcons name="delete" size={24} color="#FFFFFF" />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        );
    }, []);

    const renderAttachmentOptions = useCallback(() => (
        <Modal
            isVisible={showAttachmentOptions}
            onBackdropPress={() => setShowAttachmentOptions(false)}
            style={styles.attachmentModal}
            animationIn="slideInUp"
            animationOut="slideOutDown"
        >
            <View style={styles.attachmentOptions}>
                <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={handleImagePicker}
                >
                    <MaterialIcons name="image" size={24} color="#4A90E2" />
                    <Text style={styles.attachmentOptionText}>이미지</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={handleDocumentPicker}
                >
                    <MaterialIcons name="attach-file" size={24} color="#4A90E2" />
                    <Text style={styles.attachmentOptionText}>파일</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={() => {
                        setShowAttachmentOptions(false);
                        navigation.navigate('Location');
                    }}
                >
                    <MaterialIcons name="location-on" size={24} color="#4A90E2" />
                    <Text style={styles.attachmentOptionText}>위치</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    ), [showAttachmentOptions]);

    const renderMessageOptionsModal = useCallback(() => (
        <Modal
            isVisible={showOptionsModal}
            onBackdropPress={() => setShowOptionsModal(false)}
            style={styles.optionsModal}
            animationIn="slideInUp"
            animationOut="slideOutDown"
        >
            <BlurView
                style={styles.optionsBlurView}
                blurType="light"
                blurAmount={5}
            >
                <View style={styles.messageOptions}>
                    <TouchableOpacity
                        style={styles.messageOption}
                        onPress={() => {
                            handleCopyMessage(selectedMessage);
                            setShowOptionsModal(false);
                        }}
                    >
                        <MaterialIcons name="content-copy" size={24} color="#333333" />
                        <Text style={styles.messageOptionText}>복사</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.messageOption}
                        onPress={() => {
                            handleForwardMessage(selectedMessage);
                            setShowOptionsModal(false);
                        }}
                    >
                        <MaterialIcons name="forward" size={24} color="#333333" />
                        <Text style={styles.messageOptionText}>전달</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.messageOption}
                        onPress={() => {
                            handleReply(selectedMessage);
                            setShowOptionsModal(false);
                        }}
                    >
                        <MaterialIcons name="reply" size={24} color="#333333" />
                        <Text style={styles.messageOptionText}>답장</Text>
                    </TouchableOpacity>
                    {selectedMessage?.senderId === 'currentUserId' && (
                        <TouchableOpacity
                            style={[styles.messageOption, styles.deleteOption]}
                            onPress={() => {
                                handleDeleteMessage(selectedMessage.id);
                                setShowOptionsModal(false);
                            }}
                        >
                            <MaterialIcons name="delete" size={24} color="#FF3B30" />
                            <Text style={[styles.messageOptionText, styles.deleteText]}>
                                삭제
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </BlurView>
        </Modal>
    ), [showOptionsModal, selectedMessage]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={initializeChat}
                >
                    <Text style={styles.retryButtonText}>다시 시도</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 상단 바 */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#757575" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.profileContainer}
                    onPress={() => navigation.navigate('Profile', { userId: recipientId })}
                >
                    <FastImage
                        source={{ uri: recipient?.profileImage }}
                        style={styles.profileImage}
                        defaultSource={require('../assets/default-profile.png')}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{recipient?.name}</Text>
                        <View style={styles.statusContainer}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: recipient?.isOnline ? '#4CAF50' : '#757575' }
                                ]}
                            />
                            <Text style={styles.statusText}>
                                {recipient?.isOnline ? '온라인' : '오프라인'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => navigation.navigate('Call', {
                            type: 'voice',
                            userId: recipientId
                        })}
                    >
                        <MaterialIcons name="phone" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => navigation.navigate('Call', {
                            type: 'video',
                            userId: recipientId
                        })}
                    >
                        <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setShowOptionsModal(true)}
                    >
                        <MaterialIcons name="more-vert" size={24} color="#757575" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 메시지 목록 */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
                inverted
                onEndReached={handleLoadMoreMessages}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isTyping && (
                    <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>입력 중...</Text>
                    </View>
                )}
            />

            {/* 답장 모드 UI */}
            {replyToMessage && (
                <View style={styles.replyPreview}>
                    <View style={styles.replyContent}>
                        <Text style={styles.replyTitle}>답장:</Text>
                        <Text style={styles.replyText} numberOfLines={1}>
                            {replyToMessage.text}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.cancelReplyButton}
                        onPress={() => setReplyToMessage(null)}
                    >
                        <MaterialIcons name="close" size={24} color="#757575" />
                    </TouchableOpacity>
                </View>
            )}

            {/* 입력창 */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity
                        style={styles.emojiButton}
                        onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <MaterialIcons
                            name="insert-emoticon"
                            size={24}
                            color="#757575"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.attachButton}
                        onPress={() => setShowAttachmentOptions(true)}
                    >
                        <MaterialIcons
                            name="attach-file"
                            size={24}
                            color="#757575"
                        />
                    </TouchableOpacity>

                    <TextInput
                        ref={inputRef}
                        style={[
                            styles.input,
                            { height: Math.min(inputHeight, MAX_INPUT_HEIGHT) }
                        ]}
                        value={inputText}
                        onChangeText={text => {
                            setInputText(text);
                            handleTyping();
                        }}
                        placeholder="메시지를 입력하세요"
                        multiline
                        onContentSizeChange={(event) => {
                            setInputHeight(event.nativeEvent.contentSize.height);
                        }}
                    />

                    {inputText.trim().length > 0 ? (
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={handleSendMessage}
                        >
                            <MaterialIcons name="send" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : (
                        <Animated.View
                            style={[
                                styles.voiceButton,
                                { transform: [{ scale: recordingAnimation }] }
                            ]}
                        >
                            <TouchableOpacity
                                onPress={handleVoiceRecord}
                                style={[
                                    styles.iconButton,
                                    isRecording && styles.recordingButton
                                ]}
                            >
                                <MaterialIcons
                                    name="mic"
                                    size={24}
                                    color={isRecording ? '#FF3B30' : '#FFFFFF'}
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>

                {showEmojiPicker && (
                    <EmojiSelector
                        onEmojiSelected={emoji => {
                            setInputText(prev => prev + emoji);
                            Haptics.selectionAsync();
                        }}
                        columns={8}
                        showSearchBar={false}
                        showHistory={true}
                        showSectionTitles={false}
                        category={[]}
                        style={styles.emojiPicker}
                    />
                )}
            </KeyboardAvoidingView>

            {renderAttachmentOptions()}
            {renderMessageOptionsModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
    },
    profileInfo: {
        marginLeft: 12,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 2,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#757575',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    messageContainer: {
        maxWidth: width * MESSAGE_WIDTH_PERCENTAGE,
        marginVertical: 4,
        padding: 12,
        borderRadius: 16,
    },
    sentMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#E8F5E9',
    },
    receivedMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
    },
    selectedMessage: {
        backgroundColor: '#E3F2FD',
    },
    messageText: {
        fontSize: 16,
        color: '#333333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    timestamp: {
        fontSize: 12,
        color: '#757575',
        marginRight: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Light',
    },
    replyContainer: {
        backgroundColor: '#F5F5F5',
        borderLeftWidth: 4,
        borderLeftColor: '#4A90E2',
        padding: 8,
        marginBottom: 8,
        borderRadius: 4,
    },
    replyText: {
        fontSize: 14,
        color: '#757575',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginHorizontal: 8,
        maxHeight: MAX_INPUT_HEIGHT,
        padding: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    emojiButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingButton: {
        backgroundColor: '#FF3B30',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    emojiPicker: {
        height: 250,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    messageActions: {
        flexDirection: 'row',
        width: 160,
    },
    messageAction: {
        width: 80,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyAction: {
        backgroundColor: '#4A90E2',
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
    },
    attachmentModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    attachmentOptions: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    attachmentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    attachmentOptionText: {
        fontSize: 16,
        marginLeft: 12,
        color: '#333333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    optionsModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    optionsBlurView: {
        ...StyleSheet.absoluteFillObject,
    },
    messageOptions: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
    messageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    messageOptionText: {
        fontSize: 16,
        marginLeft: 12,
        color: '#333333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    deleteOption: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        marginTop: 8,
        paddingTop: 8,
    },
    deleteText: {
        color: '#FF3B30',
    },
    reactionContainer: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    reactionEmoji: {
        fontSize: 24,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    typingText: {
        fontSize: 12,
        color: '#757575',
        marginLeft: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    mediaMessage: {
        maxWidth: width * 0.6,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 4,
    },
    mediaImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    mediaVideo: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: '#000000',
    },
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        color: '#333333',
        marginLeft: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    },
    fileSize: {
        fontSize: 12,
        color: '#757575',
        marginLeft: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Regular',
    }
});
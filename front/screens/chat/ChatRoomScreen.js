// ChatRoomScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Keyboard,
    Alert,
    Image,
    PanResponder,
    ActivityIndicator, StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';
import FastImage from 'react-native-fast-image';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Video from 'react-native-video';
import ImageViewer from 'react-native-image-zoom-viewer';
import EmojiSelector from 'react-native-emoji-selector';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import socket from '../utils/socket';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INPUT_MIN_HEIGHT = 50;
const INPUT_MAX_HEIGHT = 150;
const MESSAGE_MAX_WIDTH = SCREEN_WIDTH * 0.75;

const ChatRoomScreen = () => {
    // 상태 관리
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);
    const [isRecording, setIsRecording] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    // Refs
    const flatListRef = useRef(null);
    const inputRef = useRef(null);
    const recordingRef = useRef(null);
    const swipeableRefs = useRef({});
    const typingTimeoutRef = useRef(null);
    const doubleTapRef = useRef(null);
    const lastTapRef = useRef(0);

    // Navigation & Route
    const navigation = useNavigation();
    const route = useRoute();
    const { chatId } = route.params;

    // Redux
    const dispatch = useDispatch();
    const currentUser = useSelector(state => state.auth.user);
    const chatRoom = useSelector(state => state.chat.currentRoom);

    // Animated Values
    const inputAnimation = useRef(new Animated.Value(INPUT_MIN_HEIGHT)).current;
    const messageAnimation = useRef(new Animated.Value(1)).current;
    const emojiPickerAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await Promise.all([
                initializeVoiceRecognition(),
                fetchMessages(),
                setupKeyboardListeners(),
                initializeSocketListeners(),
                requestPermissions()
            ]);
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('오류', '채팅방을 불러오는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        cleanupVoiceRecognition();
        cleanupSocketListeners();
        cleanupKeyboardListeners();
    };

    // Socket 이벤트 리스너
    const initializeSocketListeners = () => {
        socket.emit('joinRoom', chatId);
        socket.on('newMessage', handleNewMessage);
        socket.on('messageRead', handleMessageRead);
        socket.on('userTyping', handleUserTyping);
        socket.on('messageDeleted', handleMessageDeleted);
    };

    const cleanupSocketListeners = () => {
        socket.emit('leaveRoom', chatId);
        socket.off('newMessage');
        socket.off('messageRead');
        socket.off('userTyping');
        socket.off('messageDeleted');
    };

    // 메시지 관련 함수
    const fetchMessages = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/api/chats/${chatId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(response.data);
            setIsLoading(false);
            markMessagesAsRead();
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            setIsLoading(false);
            Alert.alert('오류', '메시지를 불러오는데 실패했습니다.');
        }
    };

    const handleNewMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);
        if (message.sender.id !== currentUser.id) {
            markMessageAsRead(message.id);
            if (shouldAutoScroll) {
                scrollToBottom();
            } else {
                showNewMessageNotification(message);
            }
        }
    }, [currentUser.id, shouldAutoScroll]);

    const sendMessage = async () => {
        if (!inputText.trim() && !selectedImage) return;

        try {
            const token = await AsyncStorage.getItem('userToken');
            const formData = new FormData();

            if (inputText.trim()) {
                formData.append('text', inputText.trim());
            }

            if (selectedImage) {
                formData.append('media', {
                    uri: selectedImage.uri,
                    type: selectedImage.type,
                    name: selectedImage.fileName || 'image.jpg'
                });
            }

            if (replyTo) {
                formData.append('replyTo', replyTo.id);
            }

            const response = await axios.post(
                `${API_URL}/api/chats/${chatId}/messages`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setInputText('');
            setSelectedImage(null);
            setReplyTo(null);
            setInputHeight(INPUT_MIN_HEIGHT);

            // 메시지 전송 애니메이션
            Animated.sequence([
                Animated.timing(messageAnimation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(messageAnimation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                })
            ]).start();

            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('오류', '메시지 전송에 실패했습니다.');
        }
    };

    // 입력창 관련 함수
    const handleInputChange = (text) => {
        setInputText(text);
        emitTypingStatus();

        // 입력창 높이 자동 조절
        const newHeight = Math.min(
            Math.max(
                INPUT_MIN_HEIGHT,
                text.split('\n').length * 20
            ),
            INPUT_MAX_HEIGHT
        );

        setInputHeight(newHeight);
        Animated.timing(inputAnimation, {
            toValue: newHeight,
            duration: 200,
            useNativeDriver: false
        }).start();
    };

    const emitTypingStatus = useCallback(() => {
        socket.emit('typing', { chatId, userId: currentUser.id });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { chatId, userId: currentUser.id });
        }, 1000);
    }, [chatId, currentUser.id]);

    // 첨부 파일 관련 함수
    const handleAttachment = async (type) => {
        try {
            let result;

            if (type === 'image') {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.8,
                    allowsEditing: true
                });
            } else if (type === 'document') {
                result = await DocumentPicker.getDocumentAsync({
                    type: '*/*'
                });
            }

            if (!result.canceled) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            console.error('File selection failed:', error);
            Alert.alert('오류', '파일 선택에 실패했습니다.');
        }
    };

    // 제스처 핸들러
    const handleDoubleTap = (message) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
            sendReaction(message.id, '❤️');
            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
        }
    };

    const handleLongPress = (message) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedMessage(message);
        showMessageOptions(message);
    };

    // 렌더링 메서드
    const renderHeader = () => (
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
                onPress={() => navigation.navigate('Profile', { userId: chatRoom.user.id })}
            >
                <FastImage
                    style={styles.profileImage}
                    source={{
                        uri: chatRoom.user.profileImage,
                        priority: FastImage.priority.normal
                    }}
                    defaultSource={require('../../assets/images/icons/user.png')}
                />
                <View style={styles.profileInfo}>
                    <Text style={styles.userName}>{chatRoom.user.name}</Text>
                    {isTyping ? (
                        <Text style={styles.typingStatus}>입력 중...</Text>
                    ) : (
                        <View style={styles.statusContainer}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: chatRoom.user.online ? '#4CAF50' : '#757575' }
                                ]}
                            />
                            <Text style={styles.statusText}>
                                {chatRoom.user.online ? '온라인' : '오프라인'}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.headerButtons}>
                <TouchableOpacity
                    style={styles.callButton}
                    onPress={handleCallPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="phone" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={handleMenuPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="more-vert" size={24} color="#757575" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderMessage = useCallback(({ item: message }) => {
        const isOwnMessage = message.sender.id === currentUser.id;

        return (
            <Swipeable
                ref={ref => swipeableRefs.current[message.id] = ref}
                renderRightActions={() => renderMessageActions(message)}
                onSwipeableWillOpen={() => handleSwipeOpen(message)}
                enabled={!showEmojiPicker && !showAttachmentOptions}
            >
                <TouchableOpacity
                    activityOpacity={1}
                    onPress={() => handleMessagePress(message)}
                    onLongPress={() => handleLongPress(message)}
                    onDoubleTap={() => handleDoubleTap(message)}
                    delayLongPress={500}
                >
                    <Animated.View
                        style={[
                            styles.messageContainer,
                            isOwnMessage ? styles.ownMessage : styles.otherMessage,
                            {
                                transform: [{
                                    scale: message.animationValue || new Animated.Value(1)
                                }]
                            }
                        ]}
                    >
                        {!isOwnMessage && (
                            <FastImage
                                style={styles.messageSenderImage}
                                source={{
                                    uri: message.sender.profileImage,
                                    priority: FastImage.priority.low
                                }}
                                defaultSource={require('../../assets/images/icons/user.png')}
                            />
                        )}
                        <View style={[
                            styles.messageContent,
                            isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
                        ]}>
                            {message.replyTo && (
                                <View style={styles.replyContainer}>
                                    <Text style={styles.replyText}>{message.replyTo.sender.name} : {message.replyTo.text}</Text>
                                </View>
                            )}
                            {message.type === 'image' && (
                                <TouchableOpacity
                                    onPress={() => handleImagePress(message)}
                                    style={styles.imageContainer}
                                >
                                    <FastImage
                                        style={styles.messageImage}
                                        source={{
                                            uri: message.media.url,
                                            priority: FastImage.priority.normal
                                        }}
                                        resizeMode={FastImage.resizeMode.cover}
                                    />
                                </TouchableOpacity>
                            )}
                            {message.type === 'video' && (
                                <View style={styles.videoContainer}>
                                    <Video
                                        source={{
                                            uri: message.media.url
                                        }}
                                        style={styles.messageVideo}
                                        resizeMode='cover'
                                        useNativeControls
                                        isLooping={false}
                                        shouldPlay={false}
                                        ref={videoRef}
                                        onError={(error) => {
                                            console.error('Video loading error: ', error);
                                            Alert.alert('오류', '비디오를 로드하는데 실패했습니다.');
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={styles.playButton}
                                        onPress={() => handleVideoPress(message)}
                                    >
                                        <MaterialIcons
                                            name='play-arrow'
                                            size={40}
                                            color='#FFFFFF'
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.videoDurationBadge}>
                                        <Text style={styles.videoDurationText}>{formatDuration(message.media.duration)}</Text>
                                    </View>
                                </View>
                            )}
                            {message.type === 'file' && (
                                <TouchableOpacity
                                    style={styles.fileContainer}
                                    onPress={() => handleFilePress(message)}
                                >
                                    <MaterialIcons
                                        name={getFileIcon(message.file.type)}
                                        size={36}
                                        color='#4A90E2'
                                    />
                                    <View style={styles.fileInfo}>
                                        <Text style={styles.fileName}>{message.file.name}</Text>
                                        <Text style={styles.fileSize}>{formatFileSize(message.file.size)}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            <View style={styles.messageFooter}>
                                <Text style={styles.messageTime}>
                                    {formatTime(message.createdAt)}
                                </Text>
                                {isOwnMessage && (
                                    <View style={styles.messageStatus}>
                                        <MaterialIcons
                                            name={message.isRead ? 'done-all' : 'done'}
                                            size={16}
                                            color={message.isRead ? '#4A90E2' : '#757575'}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Swipeable>
        );
    }, [selectedItems, isMultiSelectMode]);

    // 메시지 액션 렌더링
    const renderMessageActions = useCallback((message) => {
        return (
            <View style={styles.messageActions}>
                <TouchableOpacity
                    style={[styles.messageAction, styles.replyAction]}
                    onPress={() => handleReply(message)}
                >
                    <MaterialIcons name='reply' size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.messageAction, styles.forwardAction]}
                    onPress={() => handleForward(message)}
                >
                    <MaterialIcons name='forward' size={24} color="#FFFFFF" />
                </TouchableOpacity>
                {message.sender.id === currentUser.id && (
                    <TouchableOpacity
                        style={[styles.messageAction, styles.deleteAction]}
                        onPress={() => handleDelete(message)}
                    >
                        <MaterialIcons name='delete' size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [currentUser.id]);

    // 입력창 렌더링
    const renderInputToolbar = () => (
        <View style={styles.inputContainer}>
            <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => setShowEmojiPicker(prev => !prev)}
            >
                <MaterialIcons
                    name="insert-emoticon"
                    size={24}
                    color="#757575"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.attachButton}
                onPress={handleAttachment}
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
                    { height: Math.min(Math.max(INPUT_MIN_HEIGHT, inputHeight), INPUT_MAX_HEIGHT) }
                ]}
                value={inputText}
                onChangeText={handleInputChange}
                placeholder="메시지를 입력하세요"
                placeholderTextColor="#757575"
                multiline
                onContentSizeChange={(event) => {
                    setInputHeight(event.nativeEvent.contentSize.height);
                }}
            />

            {isRecording ? (
                <TouchableOpacity
                    style={[styles.voiceButton, styles.recordingButton]}
                    onPress={stopRecording}
                >
                    <MaterialIcons
                        name="mic"
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={startRecording}
                    onLongPress={startRecording}
                    onPressOut={stopRecording}
                >
                    <MaterialIcons
                        name="mic-none"
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[
                    styles.sendButton,
                    (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() && !selectedImage}
            >
                <MaterialIcons
                    name="send"
                    size={24}
                    color={(!inputText.trim() && !selectedImage) ? "#BDBDBD" : "#FFFFFF"}
                />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {renderHeader()}

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
                inverted
                onEndReached={loadMoreMessages}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={isLoading ? renderLoader : null}
                ListEmptyComponent={!isLoading && renderEmptyState}
            />

            {renderInputToolbar()}

            {showEmojiPicker && (
                <EmojiSelector
                    style={styles.emojiPicker}
                    onEmojiSelected={emoji => {
                        setInputText(prev => prev + emoji);
                        setShowEmojiPicker(false);
                    }}
                    showSearchBar={false}
                />
            )}

            <Modal
                visible={showImageViewer}
                transparent={true}
                onRequestClose={() => setShowImageViewer(false)}
            >
                <ImageViewer
                    imageUrls={[{ url: selectedImage?.url }]}
                    enableSwipeDown
                    onSwipeDown={() => setShowImageViewer(false)}
                    renderIndicator={() => null}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    // 상단 바 스타일
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    profileContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },

    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },

    profileInfo: {
        flex: 1,
    },

    userName: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 2,
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
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },

    typingStatus: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#4A90E2',
        fontStyle: 'italic',
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
        marginRight: 8,
    },

    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 메시지 목록 스타일
    messageList: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    messageContainer: {
        flexDirection: 'row',
        marginVertical: 4,
        marginHorizontal: 16,
        maxWidth: MESSAGE_MAX_WIDTH,
    },

    ownMessage: {
        justifyContent: 'flex-end',
    },

    otherMessage: {
        justifyContent: 'flex-start',
    },

    messageSenderImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },

    messageContent: {
        borderRadius: 20,
        padding: 12,
        maxWidth: '75%',
    },

    ownMessageContent: {
        backgroundColor: '#E8F5E9',
        borderBottomRightRadius: 4,
    },

    otherMessageContent: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
    },

    replyContainer: {
        borderLeftWidth: 4,
        borderLeftColor: '#4A90E2',
        paddingLeft: 8,
        marginBottom: 4,
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        borderRadius: 4,
        padding: 8,
    },

    replyText: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },

    messageText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        lineHeight: 20,
    },

    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },

    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
    },

    videoContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },

    messageVideo: {
        width: 200,
        height: 200,
        borderRadius: 12,
    },

    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    videoDurationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },

    videoDurationText: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#FFFFFF',
    },

    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
    },

    fileInfo: {
        marginLeft: 12,
        flex: 1,
    },

    fileName: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },

    fileSize: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },

    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },

    messageTime: {
        fontSize: 12,
        fontFamily: 'Roboto-Light',
        color: '#757575',
        marginRight: 4,
    },

    messageStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // 입력창 스타일
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        minHeight: 50,
        maxHeight: 150,
    },

    emojiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    attachButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    input: {
        flex: 1,
        marginHorizontal: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        maxHeight: 100,
    },

    voiceButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
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
        marginLeft: 8,
    },

    sendButtonDisabled: {
        backgroundColor: '#E0E0E0',
    },

    // 이모지 선택기 스타일
    emojiPicker: {
        height: 250,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },

    // 로딩 및 빈 상태 스타일
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },

    emptyText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
        textAlign: 'center',
        marginTop: 8,
    },
})
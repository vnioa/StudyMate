// src/screens/chat/ChatRoomScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import api from '../../services/api';
import socket from '../../services/socket';
import { Avatar } from '../../components/UI';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export default function ChatRoomScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { roomId, name } = route.params;
    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    // 상태 관리
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [participants, setParticipants] = useState([]);
    const typingTimeoutRef = useRef(null);

    // 메시지 로드
    const loadMessages = async () => {
        try {
            const response = await api.chat.getMessages(roomId);
            setMessages(response.reverse());
            setIsLoading(false);
        } catch (error) {
            Alert.alert('오류', '메시지를 불러오는데 실패했습니다.');
        }
    };

    // 초기 설정
    useEffect(() => {
        loadMessages();
        setupSocketListeners();
        loadParticipants();

        return () => {
            socket.emit('chat:leave', { roomId });
            cleanupSocketListeners();
        };
    }, [roomId]);

    // 참가자 정보 로드
    const loadParticipants = async () => {
        try {
            const response = await api.chat.getRoomParticipants(roomId);
            setParticipants(response);
        } catch (error) {
            console.error('Failed to load participants:', error);
        }
    };

    // 소켓 리스너 설정
    const setupSocketListeners = () => {
        socket.emit('chat:join', { roomId });

        socket.on('chat:message', handleNewMessage);
        socket.on('chat:typing', handleUserTyping);
        socket.on('chat:stopTyping', handleUserStopTyping);
        socket.on('chat:read', handleMessageRead);
    };

    // 소켓 리스너 정리
    const cleanupSocketListeners = () => {
        socket.off('chat:message');
        socket.off('chat:typing');
        socket.off('chat:stopTyping');
        socket.off('chat:read');
    };

    // 새 메시지 처리
    const handleNewMessage = (message) => {
        setMessages(prev => [message, ...prev]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 타이핑 상태 처리
    const handleUserTyping = ({ userId, username }) => {
        setTypingUsers(prev => new Set(prev).add(username));
    };

    const handleUserStopTyping = ({ userId, username }) => {
        setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(username);
            return newSet;
        });
    };

    // 메시지 읽음 처리
    const handleMessageRead = ({ messageId, userId }) => {
        setMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, readBy: [...msg.readBy, userId] }
                : msg
        ));
    };

    const handleFilePress = async (file) => {
        // 파일 유형에 따른 처리
        switch (file.type) {
            case 'image':
                // 이미지 뷰어로 이동
                navigation.navigate('FileShare', {
                    type: 'image',
                    url: file.url,
                    name: file.name
                });
                break;
            case 'document':
                // 문서 뷰어로 이동
                navigation.navigate('FileShare', {
                    type: 'document',
                    url: file.url,
                    name: file.name
                });
                break;
            case 'video':
                // 비디오 플레이어로 이동
                navigation.navigate('FileShare', {
                    type: 'video',
                    url: file.url,
                    name: file.name
                });
                break;
            default:
                // 기본 파일 다운로드 처리
                await handleFileDownload(file);
                break;
        }
    };

    // 파일 다운로드 처리
    const handleFileDownload = async (file) => {
        try {
            // 파일 다운로드 시작
            const downloadResumable = FileSystem.createDownloadResumable(
                file.url,
                FileSystem.documentDirectory + file.name,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    // 다운로드 진행률 업데이트
                    console.log(progress * 100);
                }
            );

            const { uri } = await downloadResumable.downloadAsync();

            // 파일 저장 권한 확인
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
                // 다운로드한 파일을 미디어 라이브러리에 저장
                await MediaLibrary.createAssetAsync(uri);
                Alert.alert('성공', '파일이 성공적으로 다운로드되었습니다.');
            }
        } catch (error) {
            console.error('File download error:', error);
            Alert.alert('오류', '파일 다운로드에 실패했습니다.');
        }
    };

    // 메시지 전송
    const sendMessage = async () => {
        if (!inputText.trim() && !isUploading) return;

        try {
            const message = await api.chat.sendMessage(roomId, {
                content: inputText.trim()
            });
            setInputText('');
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            Alert.alert('오류', '메시지 전송에 실패했습니다.');
        }
    };

    // 입력 처리
    const handleInputChange = (text) => {
        setInputText(text);

        // 타이핑 상태 전송
        if (!isTyping) {
            setIsTyping(true);
            socket.emit('chat:typing', { roomId });
        }

        // 타이핑 종료 타이머 설정
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('chat:stopTyping', { roomId });
        }, 1000);
    };

    // 이미지 선택 및 전송
    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
            });

            if (!result.canceled) {
                setIsUploading(true);
                const response = await api.chat.uploadFile(roomId, result.assets[0]);
                setIsUploading(false);
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        } catch (error) {
            setIsUploading(false);
            Alert.alert('오류', '이미지 업로드에 실패했습니다.');
        }
    };

    // 메시지 렌더링
    const renderMessage = ({ item: message }) => (
        <View style={[
            styles.messageContainer,
            message.isMine ? styles.myMessage : styles.otherMessage
        ]}>
            {!message.isMine && (
                <Avatar
                    source={{ uri: message.user.avatar }}
                    size="small"
                    style={styles.messageAvatar}
                />
            )}
            <View style={[
                styles.messageBubble,
                message.isMine ? styles.myBubble : styles.otherBubble
            ]}>
                {!message.isMine && (
                    <Text style={styles.messageUsername}>{message.user.name}</Text>
                )}
                {message.type === 'image' ? (
                    <Image
                        source={{ uri: message.content }}
                        style={styles.messageImage}
                        resizeMode="cover"
                    />
                ) : (
                    <Text style={[
                        styles.messageText,
                        message.isMine ? styles.myMessageText : styles.otherMessageText
                    ]}>
                        {message.content}
                    </Text>
                )}
                <Text style={[
                    styles.messageTime,
                    message.isMine ? styles.myMessageTime : styles.otherMessageTime
                ]}>
                    {date.formatTime(message.createdAt)}
                </Text>
            </View>
        </View>
    );

    // 헤더 설정
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('VideoCall', { roomId })}
                    >
                        <Ionicons name="videocam-outline" size={24} color={theme.colors.primary.main} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('FileShare', { roomId })}
                    >
                        <Ionicons name="document-outline" size={24} color={theme.colors.primary.main} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, roomId]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id.toString()}
                    inverted
                    contentContainerStyle={styles.messageList}
                />

                {typingUsers.size > 0 && (
                    <View style={styles.typingContainer}>
                        <Text style={styles.typingText}>
                            {Array.from(typingUsers).join(', ')} 입력 중...
                        </Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TouchableOpacity
                        style={styles.attachButton}
                        onPress={handleImagePick}
                    >
                        <Ionicons name="image-outline" size={24} color={theme.colors.primary.main} />
                    </TouchableOpacity>

                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={inputText}
                        onChangeText={handleInputChange}
                        placeholder="메시지를 입력하세요"
                        multiline
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() && !isUploading) && styles.sendButtonDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() && !isUploading}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={(!inputText.trim() && !isUploading)
                                ? theme.colors.text.disabled
                                : theme.colors.primary.main
                            }
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: theme.spacing.md,
    },
    headerButton: {
        padding: theme.spacing.sm,
        marginLeft: theme.spacing.sm,
    },
    messageList: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.lg,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
    },
    messageAvatar: {
        marginRight: theme.spacing.sm,
        alignSelf: 'flex-end',
    },
    messageBubble: {
        padding: theme.spacing.md,
        borderRadius: 16,
        maxWidth: '100%',
    },
    myBubble: {
        backgroundColor: theme.colors.primary.main,
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: theme.colors.grey[200],
        borderBottomLeftRadius: 4,
    },
    messageUsername: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    messageText: {
        fontSize: theme.typography.size.body1,
        lineHeight: theme.typography.lineHeight.body1,
    },
    myMessageText: {
        color: theme.colors.text.contrast,
    },
    otherMessageText: {
        color: theme.colors.text.primary,
    },
    messageTime: {
        fontSize: theme.typography.size.caption,
        marginTop: 4,
    },
    myMessageTime: {
        color: theme.colors.text.contrast + '80',
        textAlign: 'right',
    },
    otherMessageTime: {
        color: theme.colors.text.secondary,
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 8,
    },
    typingContainer: {
        padding: theme.spacing.sm,
        paddingLeft: theme.spacing.lg,
    },
    typingText: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    attachButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        minHeight: 40,
        backgroundColor: theme.colors.grey[100],
        borderRadius: 20,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        fontSize: theme.typography.size.body1,
    },
    sendButton: {
        padding: theme.spacing.sm,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
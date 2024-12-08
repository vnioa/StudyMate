import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../../styles/theme';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const MessageItem = memo(({ msg, onLongPress, isOnline }) => (
    <Pressable
        style={[
            styles.messageContainer,
            msg.isImportant && styles.importantMessage,
            !isOnline && styles.offlineMessage
        ]}
        onLongPress={() => onLongPress(msg)}
        disabled={!isOnline}
    >
        <Text style={styles.sender}>{msg.sender}</Text>
        <Text style={styles.message}>{msg.content}</Text>
        {msg.preview && (
            <View style={styles.linkPreview}>
                <Text style={styles.previewTitle}>{msg.preview.title}</Text>
                <Text style={styles.previewDescription}>
                    {msg.preview.description}
                </Text>
            </View>
        )}
        <Text style={styles.timestamp}>
            {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}
        </Text>
    </Pressable>
));

const AttachmentMenu = memo(({ visible, slideAnimation, onClose, onImageUpload, isOnline }) => {
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
            });

            if (!result.canceled && result.assets[0].uri) {
                onImageUpload(result.assets[0].uri);
                onClose();
            }
        } catch (error) {
            Alert.alert('오류', '이미지를 선택하는데 실패했습니다');
        }
    };

    if (!visible) return null;

    return (
        <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View style={[
                styles.attachmentMenu,
                { transform: [{ translateY: slideAnimation }] }
            ]}>
                <TouchableOpacity
                    style={styles.attachmentOption}
                    disabled={!isOnline}
                >
                    <Icon name="file" size={24} color={isOnline ? theme.colors.text : theme.colors.textDisabled} />
                    <Text style={[styles.attachmentText, !isOnline && styles.textDisabled]}>파일</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={pickImage}
                    disabled={!isOnline}
                >
                    <Icon name="image" size={24} color={isOnline ? theme.colors.text : theme.colors.textDisabled} />
                    <Text style={[styles.attachmentText, !isOnline && styles.textDisabled]}>이미지</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.attachmentOption}
                    disabled={!isOnline}
                >
                    <Icon name="bar-chart-2" size={24} color={isOnline ? theme.colors.text : theme.colors.textDisabled} />
                    <Text style={[styles.attachmentText, !isOnline && styles.textDisabled]}>투표</Text>
                </TouchableOpacity>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
});

const MessageOptionsModal = memo(({ visible, onClose, onAction, isOnline }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => onAction('reply')}
                        disabled={!isOnline}
                    >
                        <Icon name="corner-up-left" size={20} color={isOnline ? theme.colors.text : theme.colors.textDisabled} />
                        <Text style={[
                            styles.modalOptionText,
                            !isOnline && styles.textDisabled
                        ]}>답장</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => onAction('important')}
                        disabled={!isOnline}
                    >
                        <Icon name="star" size={20} color={isOnline ? theme.colors.text : theme.colors.textDisabled} />
                        <Text style={[
                            styles.modalOptionText,
                            !isOnline && styles.textDisabled
                        ]}>중요 표시</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalOption, styles.deleteOption]}
                        onPress={() => onAction('delete')}
                        disabled={!isOnline}
                    >
                        <Icon name="trash-2" size={20} color={theme.colors.error} />
                        <Text style={[styles.modalOptionText, styles.deleteText]}>
                            삭제
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
));

const ChatRoomScreen = ({ route, navigation }) => {
    const { roomId, roomName } = route.params;
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const scrollViewRef = useRef();
    const attachmentSlide = useRef(new Animated.Value(-200)).current;

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchMessages = async () => {
        if (!(await checkNetwork())) {
            const cachedMessages = await AsyncStorage.getItem(`messages_${roomId}`);
            if (cachedMessages) {
                setMessages(JSON.parse(cachedMessages));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/chat/rooms/${roomId}`);
            if (response.data.success) {
                setMessages(response.data.messages);
                await AsyncStorage.setItem(`messages_${roomId}`,
                    JSON.stringify(response.data.messages));
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '메시지를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMessages();
            markRoomAsRead();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });

            return () => {
                unsubscribe();
                setMessages([]);
                setMessage('');
            };
        }, [])
    );

    useEffect(() => {
        if (!isOnline) return;

        const interval = setInterval(async () => {
            if (messages.length > 0) {
                const lastMessageId = messages[messages.length - 1].id;
                try {
                    const response = await api.get(`/api/chat/${roomId}/messages`, {
                        params: { after: lastMessageId }
                    });
                    if (response.data.messages.length > 0) {
                        setMessages(prev => [...prev, ...response.data.messages]);
                        await AsyncStorage.setItem(`messages_${roomId}`,
                            JSON.stringify([...messages, ...response.data.messages]));
                    }
                } catch (error) {
                    console.error('메시지 갱신 실패:', error);
                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [roomId, messages, isOnline]);

    const markRoomAsRead = async () => {
        if (!isOnline) return;

        try {
            await api.put(`/api/chat/rooms/${roomId}/read`);
        } catch (error) {
            console.error('읽음 표시 실패:', error.message);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !isOnline) return;

        try {
            const response = await api.post(`/api/chat/rooms/${roomId}/messages`, {
                content: message.trim()
            });
            if (response.data.success) {
                setMessages(prev => [...prev, response.data.message]);
                setMessage('');
                scrollViewRef.current?.scrollToEnd({ animated: true });
                await AsyncStorage.setItem(`messages_${roomId}`,
                    JSON.stringify([...messages, response.data.message]));
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '메시지 전송에 실패했습니다');
        }
    };

    const handleImageUpload = async (imageUri) => {
        if (!isOnline) return;

        try {
            setLoading(true);
            const formData = new FormData();
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image';

            formData.append('image', {
                uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                name: filename,
                type: type
            });

            const response = await api.post(`/api/chat/rooms/${roomId}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setMessages(prev => [...prev, response.data.message]);
                scrollViewRef.current?.scrollToEnd({ animated: true });
                await AsyncStorage.setItem(`messages_${roomId}`,
                    JSON.stringify([...messages, response.data.message]));
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '이미지 전송에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const showAttachmentMenu = () => {
        if (!isOnline) return;

        setShowAttachments(true);
        Animated.spring(attachmentSlide, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8
        }).start();
    };

    const hideAttachmentMenu = () => {
        Animated.spring(attachmentSlide, {
            toValue: -200,
            useNativeDriver: true,
            friction: 8
        }).start(() => setShowAttachments(false));
    };

    const handleMessageLongPress = (msg) => {
        if (!isOnline) return;
        setSelectedMessage(msg);
        setShowMessageOptions(true);
    };

    const handleMessageAction = async (action) => {
        if (!selectedMessage || !isOnline) return;

        try {
            switch (action) {
                case 'delete':
                    await api.delete(`/api/chat/messages/${selectedMessage.id}`);
                    setMessages(prev =>
                        prev.filter(m => m.id !== selectedMessage.id));
                    await AsyncStorage.setItem(`messages_${roomId}`,
                        JSON.stringify(messages.filter(m => m.id !== selectedMessage.id)));
                    break;
                case 'important':
                    await api.put(`/api/chat/messages/${selectedMessage.id}/important`);
                    setMessages(prev => prev.map(m =>
                        m.id === selectedMessage.id
                            ? { ...m, isImportant: !m.isImportant }
                            : m
                    ));
                    await AsyncStorage.setItem(`messages_${roomId}`,
                        JSON.stringify(messages));
                    break;
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '작업을 수행하는데 실패했습니다');
        } finally {
            setShowMessageOptions(false);
            setSelectedMessage(null);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        hitSlop={20}
                    >
                        <Icon name="arrow-left" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>{roomName}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.headerIcon}
                        onPress={() => setSearchVisible(true)}
                        hitSlop={20}
                        disabled={!isOnline}
                    >
                        <Icon
                            name="search"
                            size={24}
                            color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                        />
                    </Pressable>
                    <Pressable
                        onPress={() => navigation.navigate('ChatRoomSettings', { roomId })}
                        hitSlop={20}
                        disabled={!isOnline}
                    >
                        <Icon
                            name="settings"
                            size={24}
                            color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                        />
                    </Pressable>
                </View>
            </View>

            {searchVisible && (
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="메시지 검색..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        returnKeyType="search"
                        editable={isOnline}
                    />
                    <Pressable onPress={() => setSearchVisible(false)}>
                        <Icon name="x" size={20} color={theme.colors.textSecondary} />
                    </Pressable>
                </View>
            )}

            {loading ? (
                <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                    style={styles.loader}
                />
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messageArea}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map(msg => (
                        <MessageItem
                            key={msg.id}
                            msg={msg}
                            onLongPress={handleMessageLongPress}
                            isOnline={isOnline}
                        />
                    ))}
                </ScrollView>
            )}

            <View style={styles.inputContainer}>
                <Pressable
                    onPress={showAttachmentMenu}
                    hitSlop={20}
                    disabled={!isOnline}
                >
                    <Icon
                        name="plus"
                        size={24}
                        color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                    />
                </Pressable>
                <TextInput
                    style={[
                        styles.input,
                        !isOnline && styles.inputDisabled
                    ]}
                    placeholder="메시지를 입력하세요..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={1000}
                    editable={isOnline}
                />
                <Pressable
                    onPress={handleSendMessage}
                    disabled={!message.trim() || !isOnline}
                    hitSlop={20}
                >
                    <Icon
                        name="send"
                        size={24}
                        color={message.trim() && isOnline ? theme.colors.primary : theme.colors.textDisabled}
                    />
                </Pressable>
            </View>

            <AttachmentMenu
                visible={showAttachments}
                slideAnimation={attachmentSlide}
                onClose={hideAttachmentMenu}
                onImageUpload={handleImageUpload}
                isOnline={isOnline}
            />
            <MessageOptionsModal
                visible={showMessageOptions}
                onClose={() => setShowMessageOptions(false)}
                onAction={handleMessageAction}
                isOnline={isOnline}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...theme.typography.headlineMedium,
        marginLeft: theme.spacing.md,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        margin: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginHorizontal: theme.spacing.sm,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    messageArea: {
        flex: 1,
        padding: theme.spacing.md,
    },
    messageContainer: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    importantMessage: {
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.warning,
    },
    sender: {
        ...theme.typography.titleMedium,
        marginBottom: theme.spacing.xs,
    },
    message: {
        ...theme.typography.bodyLarge,
        lineHeight: 20,
    },
    timestamp: {
        ...theme.typography.labelSmall,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
        alignSelf: 'flex-end',
    },
    linkPreview: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.small,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    previewTitle: {
        ...theme.typography.titleSmall,
        marginBottom: theme.spacing.xs,
    },
    previewDescription: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    input: {
        flex: 1,
        marginHorizontal: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderRadius: theme.roundness.full,
        maxHeight: 100,
        ...theme.typography.bodyLarge,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    attachmentMenu: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        padding: theme.spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-around',
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 4 }
        }),
    },
    attachmentOption: {
        alignItems: 'center',
        padding: theme.spacing.sm,
    },
    attachmentText: {
        marginTop: theme.spacing.xs,
        ...theme.typography.labelSmall,
        color: theme.colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.large,
        padding: theme.spacing.lg,
        ...Platform.select({
            ios: theme.shadows.large,
            android: { elevation: 5 }
        }),
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalOptionText: {
        marginLeft: theme.spacing.md,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    deleteOption: {
        borderBottomWidth: 0,
    },
    deleteText: {
        color: theme.colors.error,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offlineMessage: {
        opacity: 0.7,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

export default ChatRoomScreen;
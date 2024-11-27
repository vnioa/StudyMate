import React, { useState, useRef, useCallback, memo } from 'react';
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
    KeyboardAvoidingView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { chatAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const MessageItem = memo(({ msg, onLongPress }) => (
    <Pressable
        style={[styles.messageContainer, msg.isImportant && styles.importantMessage]}
        onLongPress={() => onLongPress(msg)}
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
                minute: '2-digit'
            })}
        </Text>
    </Pressable>
));

const AttachmentMenu = memo(({ visible, slideAnimation, onClose }) => {
    if (!visible) return null;

    return (
        <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View
                style={[
                    styles.attachmentMenu,
                    { transform: [{ translateY: slideAnimation }] }
                ]}
            >
                <TouchableOpacity style={styles.attachmentOption}>
                    <Icon name="file" size={24} color={theme.colors.text} />
                    <Text style={styles.attachmentText}>파일</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentOption}>
                    <Icon name="image" size={24} color={theme.colors.text} />
                    <Text style={styles.attachmentText}>이미지</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentOption}>
                    <Icon name="bar-chart-2" size={24} color={theme.colors.text} />
                    <Text style={styles.attachmentText}>투표</Text>
                </TouchableOpacity>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
});

const MessageOptionsModal = memo(({ visible, onClose, onAction }) => (
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
                    >
                        <Icon name="corner-up-left" size={20} color={theme.colors.text} />
                        <Text style={styles.modalOptionText}>답장</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => onAction('important')}
                    >
                        <Icon name="star" size={20} color={theme.colors.text} />
                        <Text style={styles.modalOptionText}>중요 표시</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalOption, styles.deleteOption]}
                        onPress={() => onAction('delete')}
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

    const scrollViewRef = useRef();
    const attachmentSlide = useRef(new Animated.Value(-200)).current;

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getMessages(roomId);
            setMessages(response.data);
        } catch (error) {
            Alert.alert('오류', '메시지를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useFocusEffect(
        useCallback(() => {
            fetchMessages();
            markRoomAsRead();

            return () => {
                setMessages([]);
                setMessage('');
            };
        }, [fetchMessages, roomId])
    );

    const markRoomAsRead = useCallback(async () => {
        try {
            await chatAPI.markAsRead(roomId);
        } catch (error) {
            console.error('읽음 표시 실패:', error);
        }
    }, [roomId]);

    const handleSendMessage = useCallback(async () => {
        if (!message.trim()) return;

        try {
            const response = await chatAPI.sendMessage(roomId, message.trim());
            setMessages(prev => [...prev, response.data]);
            setMessage('');
            scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            Alert.alert('오류', '메시지 전송에 실패했습니다');
        }
    }, [message, roomId]);

    const showAttachmentMenu = useCallback(() => {
        setShowAttachments(true);
        Animated.spring(attachmentSlide, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8
        }).start();
    }, [attachmentSlide]);

    const hideAttachmentMenu = useCallback(() => {
        Animated.spring(attachmentSlide, {
            toValue: -200,
            useNativeDriver: true,
            friction: 8
        }).start(() => setShowAttachments(false));
    }, [attachmentSlide]);

    const handleMessageLongPress = useCallback((msg) => {
        setSelectedMessage(msg);
        setShowMessageOptions(true);
    }, []);

    const handleMessageAction = useCallback(async (action) => {
        if (!selectedMessage) return;

        try {
            switch (action) {
                case 'delete':
                    await chatAPI.deleteMessage(selectedMessage.id);
                    setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
                    break;
                case 'important':
                    await chatAPI.togglePin(selectedMessage.id);
                    setMessages(prev => prev.map(m =>
                        m.id === selectedMessage.id ? {...m, isImportant: !m.isImportant} : m
                    ));
                    break;
            }
        } catch (error) {
            Alert.alert('오류', '작업을 수행하는데 실패했습니다');
        } finally {
            setShowMessageOptions(false);
            setSelectedMessage(null);
        }
    }, [selectedMessage]);

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
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="arrow-left" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>{roomName}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.headerIcon}
                        onPress={() => setSearchVisible(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="search" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Pressable
                        onPress={() => navigation.navigate('ChatRoomSettings', { roomId })}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="settings" size={24} color={theme.colors.text} />
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
                    />
                    <Pressable onPress={() => setSearchVisible(false)}>
                        <Icon name="x" size={20} color={theme.colors.textSecondary} />
                    </Pressable>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
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
                        />
                    ))}
                </ScrollView>
            )}

            <View style={styles.inputContainer}>
                <Pressable
                    onPress={showAttachmentMenu}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="plus" size={24} color={theme.colors.text} />
                </Pressable>
                <TextInput
                    style={styles.input}
                    placeholder="메시지를 입력하세요..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={1000}
                    placeholderTextColor={theme.colors.textTertiary}
                />
                <Pressable
                    onPress={handleSendMessage}
                    disabled={!message.trim()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon
                        name="send"
                        size={24}
                        color={message.trim() ? theme.colors.primary : theme.colors.disabled}
                    />
                </Pressable>
            </View>

            <AttachmentMenu
                visible={showAttachments}
                slideAnimation={attachmentSlide}
                onClose={hideAttachmentMenu}
            />

            <MessageOptionsModal
                visible={showMessageOptions}
                onClose={() => setShowMessageOptions(false)}
                onAction={handleMessageAction}
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: {elevation: 2}
        }),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        marginLeft: theme.spacing.md,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: theme.spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        margin: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        marginHorizontal: theme.spacing.sm,
        ...theme.typography.bodyMedium,
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
            android: {elevation: 1}
        }),
    },
    importantMessage: {
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.warning,
    },
    sender: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
    },
    message: {
        ...theme.typography.bodyMedium,
    },
    timestamp: {
        ...theme.typography.bodySmall,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xs,
        alignSelf: 'flex-end',
    },
    linkPreview: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderRadius: theme.roundness.small,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    previewTitle: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
    },
    previewDescription: {
        ...theme.typography.bodyMedium,
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
        marginHorizontal: theme.spacing.md,
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderRadius: theme.roundness.large,
        maxHeight: 100,
        ...theme.typography.bodyLarge,
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
            android: {elevation: 4}
        }),
    },
    attachmentOption: {
        alignItems: 'center',
        padding: theme.spacing.sm,
    },
    attachmentText: {
        marginTop: theme.spacing.xs,
        ...theme.typography.bodySmall,
        color: theme.colors.text,
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
            android: {elevation: 5}
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
});

export default ChatRoomScreen;
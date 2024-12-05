import React, {useState, useRef, useCallback, useEffect} from 'react';
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
import { chatAPI } from '../../../services/api';

const MessageItem = ({ msg, onLongPress }) => (
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
                minute: '2-digit',
                hour12: false
            })}
        </Text>
    </Pressable>
);

const AttachmentMenu = ({ visible, slideAnimation, onClose }) => {
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
                    <Icon name="file" size={24} color="#333" />
                    <Text style={styles.attachmentText}>파일</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentOption}>
                    <Icon name="image" size={24} color="#333" />
                    <Text style={styles.attachmentText}>이미지</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentOption}>
                    <Icon name="bar-chart-2" size={24} color="#333" />
                    <Text style={styles.attachmentText}>투표</Text>
                </TouchableOpacity>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const MessageOptionsModal = ({ visible, onClose, onAction }) => (
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
                        <Icon name="corner-up-left" size={20} color="#333" />
                        <Text style={styles.modalOptionText}>답장</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={() => onAction('important')}
                    >
                        <Icon name="star" size={20} color="#333" />
                        <Text style={styles.modalOptionText}>중요 표시</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalOption, styles.deleteOption]}
                        onPress={() => onAction('delete')}
                    >
                        <Icon name="trash-2" size={20} color="#ff4444" />
                        <Text style={[styles.modalOptionText, styles.deleteText]}>
                            삭제
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableWithoutFeedback>
    </Modal>
);

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

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getChatRoom(roomId);
            if (response.success) {
                setMessages(response.messages);
                setRoomInfo(response.room);
            }
        } catch (error) {
            Alert.alert('오류', error.message || '메시지를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMessages();
            markRoomAsRead();
            return () => {
                setMessages([]);
                setMessage('');
            };
        }, [])
    );

    useEffect(() => {
        const interval = setInterval(async () => {
            if (messages.length > 0) {
                const lastMessageId = messages[messages.length - 1].id;
                try {
                    const response = await chatAPI.getMessages(roomId, {
                        after: lastMessageId
                    });
                    if (response.messages.length > 0) {
                        setMessages(prev => [...prev, ...response.messages]);
                    }
                } catch (error) {
                    console.error('메시지 갱신 실패:', error);
                }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [roomId, messages]);

    const loadRoomInfo = async () => {
        try {
            const response = await chatAPI.getRoomInfo(roomId);
            setRoomInfo(response.roomInfo);
        } catch (error) {
            Alert.alert('오류', error.message || '채팅방 정보를 불러오는데 실패했습니다');
        }
    };

    const markRoomAsRead = async () => {
        try {
            await chatAPI.markAsRead(roomId);
        } catch (error) {
            console.error('읽음 표시 실패:', error.message);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        try {
            const response = await chatAPI.sendMessage(roomId, message.trim());
            setMessages(prev => [...prev, response.message]);  // .data.success 제거
            setMessage('');
            scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            Alert.alert('오류', error.message || '메시지 전송에 실패했습니다');
        }
    };

    const handleImageUpload = async (imageUri) => {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image';

            formData.append('image', {
                uri: imageUri,
                name: filename,
                type
            });

            const response = await chatAPI.sendImageMessage(roomId, formData);
            setMessages(prev => [...prev, response.message]);
            scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            Alert.alert('오류', error.message || '이미지 전송에 실패했습니다');
        }
    };

    const showAttachmentMenu = () => {
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
        setSelectedMessage(msg);
        setShowMessageOptions(true);
    };

    const handleMessageAction = async (action) => {
        if (!selectedMessage) return;

        try {
            switch (action) {
                case 'delete':
                    await chatAPI.deleteMessage(selectedMessage.id);
                    setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
                    break;
                case 'important':
                    await chatAPI.toggleImportant(selectedMessage.id);
                    setMessages(prev => prev.map(m =>
                        m.id === selectedMessage.id ? { ...m, isImportant: !m.isImportant } : m
                    ));
                    break;
            }
        } catch (error) {
            Alert.alert('오류', error.message || '작업을 수행하는데 실패했습니다');
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
                        <Icon name="arrow-left" size={24} color="#333" />
                    </Pressable>
                    <Text style={styles.headerTitle}>{roomName}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.headerIcon}
                        onPress={() => setSearchVisible(true)}
                        hitSlop={20}
                    >
                        <Icon name="search" size={24} color="#333" />
                    </Pressable>
                    <Pressable
                        onPress={() => navigation.navigate('ChatRoomSettings', { roomId })}
                        hitSlop={20}
                    >
                        <Icon name="settings" size={24} color="#333" />
                    </Pressable>
                </View>
            </View>

            {searchVisible && (
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="메시지 검색..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        returnKeyType="search"
                    />
                    <Pressable onPress={() => setSearchVisible(false)}>
                        <Icon name="x" size={20} color="#666" />
                    </Pressable>
                </View>
            )}

            {loading ? (
                <ActivityIndicator
                    size="large"
                    color="#4A90E2"
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
                        />
                    ))}
                </ScrollView>
            )}

            <View style={styles.inputContainer}>
                <Pressable onPress={showAttachmentMenu} hitSlop={20}>
                    <Icon name="plus" size={24} color="#333" />
                </Pressable>
                <TextInput
                    style={styles.input}
                    placeholder="메시지를 입력하세요..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={1000}
                />
                <Pressable
                    onPress={handleSendMessage}
                    disabled={!message.trim()}
                    hitSlop={20}
                >
                    <Icon
                        name="send"
                        size={24}
                        color={message.trim() ? '#4A90E2' : '#999'}
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
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 2
            }
        }),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 16,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        margin: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchInput: {
        flex: 1,
        marginHorizontal: 8,
        fontSize: 16,
    },
    messageArea: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1
            }
        }),
    },
    importantMessage: {
        borderLeftWidth: 3,
        borderLeftColor: '#ffd700',
    },
    sender: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    message: {
        fontSize: 16,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    linkPreview: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    previewDescription: {
        fontSize: 12,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        marginHorizontal: 12,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        maxHeight: 100,
        fontSize: 16,
    },
    attachmentMenu: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 4
            }
        }),
    },
    attachmentOption: {
        alignItems: 'center',
        padding: 8,
    },
    attachmentText: {
        marginTop: 4,
        fontSize: 12,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5
            }
        }),
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalOptionText: {
        marginLeft: 16,
        fontSize: 16,
        color: '#333',
    },
    deleteOption: {
        borderBottomWidth: 0,
    },
    deleteText: {
        color: '#ff4444',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default ChatRoomScreen;
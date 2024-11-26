import React, { useState, useRef, useEffect } from 'react';
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
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { chatAPI } from '../../services/api';

const ChatRoomScreen = ({ route, navigation }) => {
    const { roomId } = route.params;
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

    useEffect(() => {
        fetchMessages();
        markRoomAsRead();
    }, [roomId]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getMessages(roomId);
            setMessages(response.data);
        } catch (error) {
            Alert.alert('오류', '메시지를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const markRoomAsRead = async () => {
        try {
            await chatAPI.markAsRead(roomId);
        } catch (error) {
            console.error('읽음 표시 실패:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        try {
            const response = await chatAPI.sendMessage(roomId, message);
            setMessages(prev => [...prev, response.data]);
            setMessage('');
            scrollViewRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            Alert.alert('오류', '메시지 전송에 실패했습니다');
        }
    };

    const showAttachmentMenu = () => {
        setShowAttachments(true);
        Animated.timing(attachmentSlide, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const hideAttachmentMenu = () => {
        Animated.timing(attachmentSlide, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setShowAttachments(false));
    };

    const handleMessageLongPress = (message) => {
        setSelectedMessage(message);
        setShowMessageOptions(true);
    };

    const handleMessageAction = async (action) => {
        try {
            switch (action) {
                case 'delete':
                    await chatAPI.deleteRoom(selectedMessage.id);
                    setMessages(messages.filter(m => m.id !== selectedMessage.id));
                    break;
                case 'important':
                    await chatAPI.togglePin(selectedMessage.id);
                    setMessages(messages.map(m =>
                        m.id === selectedMessage.id ? {...m, isImportant: !m.isImportant} : m
                    ));
                    break;
            }
        } catch (error) {
            Alert.alert('오류', '작업을 수행하는데 실패했습니다');
        } finally {
            setShowMessageOptions(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#333" />
                    </Pressable>
                    <Text style={styles.headerTitle}>알고리즘 스터디</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.headerIcon}
                        onPress={() => setSearchVisible(true)}
                    >
                        <Icon name="search" size={24} color="#333" />
                    </Pressable>
                    <Pressable onPress={() => navigation.navigate('ChatRoomSettings')}>
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
                    />
                    <Pressable onPress={() => setSearchVisible(false)}>
                        <Icon name="x" size={20} color="#666" />
                    </Pressable>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messageArea}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
                >
                    {messages.map(msg => (
                        <Pressable
                            key={msg.id}
                            style={[
                                styles.messageContainer,
                                msg.isImportant && styles.importantMessage
                            ]}
                            onLongPress={() => handleMessageLongPress(msg)}
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
                    ))}
                </ScrollView>
            )}

            <View style={styles.inputContainer}>
                <Pressable onPress={showAttachmentMenu}>
                    <Icon name="plus" size={24} color="#333" />
                </Pressable>
                <TextInput
                    style={styles.input}
                    placeholder="메시지를 입력하세요..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    onSubmitEditing={handleSendMessage}
                />
                <Pressable
                    onPress={handleSendMessage}
                    disabled={!message.trim()}
                >
                    <Icon
                        name="send"
                        size={24}
                        color={message.trim() ? "#4A90E2" : "#ccc"}
                    />
                </Pressable>
            </View>

            {showAttachments && (
                <TouchableWithoutFeedback onPress={hideAttachmentMenu}>
                    <Animated.View
                        style={[
                            styles.attachmentMenu,
                            { transform: [{ translateY: attachmentSlide }] }
                        ]}
                    >
                        <TouchableOpacity style={styles.attachmentOption}>
                            <Icon name="file" size={24} color="#333" />
                            <Text>파일</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.attachmentOption}>
                            <Icon name="image" size={24} color="#333" />
                            <Text>이미지</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.attachmentOption}>
                            <Icon name="bar-chart-2" size={24} color="#333" />
                            <Text>투표</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableWithoutFeedback>
            )}

            <Modal
                visible={showMessageOptions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMessageOptions(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowMessageOptions(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => handleMessageAction('reply')}
                            >
                                <Icon name="corner-up-left" size={20} color="#333" />
                                <Text style={styles.modalOptionText}>답장</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => handleMessageAction('important')}
                            >
                                <Icon name="star" size={20} color="#333" />
                                <Text style={styles.modalOptionText}>중요 표시</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalOption, styles.deleteOption]}
                                onPress={() => handleMessageAction('delete')}
                            >
                                <Icon name="trash-2" size={20} color="#FF3B30" />
                                <Text style={[styles.modalOptionText, styles.deleteText]}>
                                    삭제
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 15,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        margin: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        marginRight: 10,
    },
    messageArea: {
        flex: 1,
        padding: 15,
    },
    messageContainer: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
    importantMessage: {
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },
    sender: {
        fontWeight: '600',
        marginBottom: 5,
    },
    message: {
        fontSize: 16,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    linkPreview: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    previewTitle: {
        fontWeight: '600',
        marginBottom: 5,
    },
    previewDescription: {
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    input: {
        flex: 1,
        marginHorizontal: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        maxHeight: 100,
    },
    attachmentMenu: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    attachmentOption: {
        alignItems: 'center',
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
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalOptionText: {
        fontSize: 16,
        marginLeft: 15,
    },
    deleteOption: {
        borderBottomWidth: 0,
    },
    deleteText: {
        color: '#FF3B30',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatRoomScreen;
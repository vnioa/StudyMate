import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { chatAPI } from '../../services/api';
import socket from '../../services/socket';

const ChatListScreen = ({ navigation }) => {
    const [chatRooms, setChatRooms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [pinnedChats, setPinnedChats] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showRoomOptions, setShowRoomOptions] = useState(false);

    useEffect(() => {
        fetchChatRooms();
        setupSocketListeners();
        return () => cleanupSocketListeners();
    }, []);

    const handleRoomAction = (action) => {
        switch (action) {
            case 'settings':
                navigation.navigate('ChatRoomSettings', { roomId: selectedRoom.id });
                break;
            case 'notification':
                toggleNotification(selectedRoom.id);
                break;
            case 'leave':
                handleLeaveRoom(selectedRoom.id);
                break;
        }
        setShowRoomOptions(false);
    };

    const setupSocketListeners = () => {
        socket.on('newMessage', handleNewMessage);
        socket.on('chatUpdated', fetchChatRooms);
    };

    const cleanupSocketListeners = () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('chatUpdated', fetchChatRooms);
    };

    const fetchChatRooms = async () => {
        try {
            const response = await chatAPI.getRooms();
            setChatRooms(response.data.rooms);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleNewMessage = (message) => {
        setChatRooms(prevRooms => {
            const updatedRooms = [...prevRooms];
            const roomIndex = updatedRooms.findIndex(room => room.id === message.roomId);
            if (roomIndex !== -1) {
                updatedRooms[roomIndex] = {
                    ...updatedRooms[roomIndex],
                    lastMessage: message.content,
                    timestamp: message.timestamp,
                    unreadCount: updatedRooms[roomIndex].unreadCount + 1
                };
            }
            return updatedRooms;
        });
    };

    const togglePinChat = async (roomId) => {
        try {
            const response = await chatAPI.togglePin(roomId);
            if (response.data.success) {
                setPinnedChats(prev =>
                    prev.includes(roomId)
                        ? prev.filter(id => id !== roomId)
                        : [...prev, roomId]
                );
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '채팅방 고정에 실패했습니다.');
        }
    };

    const filteredChats = chatRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedChats = [...filteredChats].sort((a, b) => {
        if (pinnedChats.includes(a.id) && !pinnedChats.includes(b.id)) return -1;
        if (!pinnedChats.includes(a.id) && pinnedChats.includes(b.id)) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const toggleNotification = async (roomId) => {
        try {
            const response = await chatAPI.updateRoomSettings(roomId, {
                notifications: !selectedRoom.notifications
            });
            if (response.data.success) {
                fetchChatRooms();
            }
        } catch (error) {
            Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
        }
    };

    const handleLeaveRoom = async (roomId) => {
        Alert.alert(
            '채팅방 나가기',
            '정말로 이 채팅방을 나가시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await chatAPI.leaveRoom(roomId);
                            if (response.data.success) {
                                fetchChatRooms();
                            }
                        } catch (error) {
                            Alert.alert('오류', '채팅방 나가기에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const renderChatRoom = (room) => (
        <Pressable
            key={room.id}
            style={[styles.chatRoom, pinnedChats.includes(room.id) && styles.pinnedRoom]}
            onPress={() => navigation.navigate('ChatRoom', {
                roomId: room.id,
                roomName: room.name
            })}
            onLongPress={() => {
                setSelectedRoom(room);
                setShowRoomOptions(true);
            }}
        >
            <View style={styles.chatInfo}>
                <View style={styles.chatMainInfo}>
                    <Text style={styles.chatName}>{room.name}</Text>
                    <Text style={styles.lastMessage}>{room.lastMessage}</Text>
                </View>
                <View style={styles.chatMeta}>
                    <Text style={styles.timestamp}>{room.timestamp}</Text>
                    {room.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>{room.unreadCount}</Text>
                        </View>
                    )}
                    {pinnedChats.includes(room.id) && (
                        <Icon name="pin" size={16} color="#666" style={styles.pinIcon} />
                    )}
                </View>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="채팅방 검색..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <Icon name="x" size={20} color="#666" />
                        </Pressable>
                    )}
                </View>
            </View>

            <ScrollView style={styles.chatList}>
                {sortedChats.map(renderChatRoom)}
            </ScrollView>

            <TouchableOpacity
                style={styles.newChatButton}
                onPress={() => navigation.navigate('NewChat')}
            >
                <Icon name="edit" size={24} color="#fff" />
            </TouchableOpacity>

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
                                onPress={() => handleMessageAction('settings')}
                            >
                                <Icon name="settings" size={20} color="#333" />
                                <Text style={styles.modalOptionText}>설정</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => handleMessageAction('notification')}
                            >
                                <Icon name="bell" size={20} color="#333" />
                                <Text style={styles.modalOptionText}>알림 설정</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalOption, styles.leaveOption]}
                                onPress={() => handleMessageAction('leave')}
                            >
                                <Icon name="log-out" size={20} color="#FF3B30" />
                                <Text style={[styles.modalOptionText, styles.leaveText]}>나가기</Text>
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
    searchSection: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    chatList: {
        flex: 1,
    },
    chatRoom: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pinnedRoom: {
        backgroundColor: '#f8f8f8',
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },
    chatInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    chatMainInfo: {
        flex: 1,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    lastMessage: {
        color: '#666',
        fontSize: 14,
    },
    chatMeta: {
        alignItems: 'flex-end',
    },
    timestamp: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
    },
    unreadBadge: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    unreadCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    newChatButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#007AFF',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    pinIcon: {
        marginTop: 4,
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
    leaveOption: {
        borderBottomWidth: 0,
    },
    leaveText: {
        color: '#FF3B30',
    },
});

export default ChatListScreen;
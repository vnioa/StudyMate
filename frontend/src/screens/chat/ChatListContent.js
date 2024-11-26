import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    Pressable,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { chatAPI } from '../../services/api';

const ChatListContent = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [chatRooms, setChatRooms] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchChatRooms();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchChatRooms();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchChatRooms = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getChatRooms();
            setChatRooms(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchChatRooms();
        setRefreshing(false);
    };

    const handlePinRoom = async (roomId, isPinned) => {
        try {
            await chatAPI.pinChatRoom(roomId, !isPinned);
            fetchChatRooms();
        } catch (error) {
            Alert.alert('오류', '채팅방 고정에 실패했습니다.');
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
    };

    const filteredChatRooms = chatRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderChatRoom = (room, isPinned = false) => (
        <Pressable
            key={room.id}
            style={[styles.chatRoom, isPinned && styles.pinnedRoom]}
            onPress={() => navigation.navigate('ChatRoom', {
                roomId: room.id,
                roomName: room.name
            })}
        >
            <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{room.name}</Text>
                    <Pressable
                        onPress={() => handlePinRoom(room.id, room.isPinned)}
                        hitSlop={10}
                    >
                        <Icon
                            name={room.isPinned ? "star" : "star-o"}
                            size={16}
                            color={room.isPinned ? "#FFD700" : "#666"}
                        />
                    </Pressable>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {room.lastMessage}
                </Text>
            </View>
            <View style={styles.chatMeta}>
                <Text style={styles.timestamp}>{room.timestamp}</Text>
                {room.unread > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{room.unread}</Text>
                    </View>
                )}
            </View>
        </Pressable>
    );

    if (loading && !chatRooms.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="채팅방 검색..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.chatList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
            >
                {filteredChatRooms
                    .filter(room => room.isPinned)
                    .map(room => renderChatRoom(room, true))}

                {filteredChatRooms
                    .filter(room => !room.isPinned)
                    .map(room => renderChatRoom(room))}

                {!filteredChatRooms.length && (
                    <Text style={styles.emptyText}>
                        채팅방이 없습니다
                    </Text>
                )}
            </ScrollView>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pinnedRoom: {
        backgroundColor: '#f8f8f8',
    },
    chatInfo: {
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
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 30
    }
});

export default ChatListContent;
import React, { useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    Pressable,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { chatAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const ChatListContent = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [chatRooms, setChatRooms] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChatRooms = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getChatRooms();
            setChatRooms(response.rooms);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '채팅방 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchChatRooms();
        }, [fetchChatRooms])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchChatRooms();
    }, [fetchChatRooms]);

    const handlePinRoom = useCallback(async (roomId, isPinned) => {
        try {
            await chatAPI.pinChatRoom(roomId, !isPinned);
            await fetchChatRooms();
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '채팅방 고정에 실패했습니다'
            );
        }
    }, [fetchChatRooms]);

    const handleSearch = useCallback(async (text) => {
        setSearchQuery(text);
        if (!text.trim()) {
            await fetchChatRooms();
            return;
        }
        try {
            setLoading(true);
            const response = await chatAPI.searchRooms(text);
            setChatRooms(response.rooms);
        } catch (error) {
            Alert.alert('오류', error.message || '채팅방 검색에 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [fetchChatRooms]);

    const handleDeleteRoom = useCallback(async (roomId) => {
        try {
            await chatAPI.deleteRoom(roomId);
            setChatRooms(prev => prev.filter(room => room.id !== roomId));
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '채팅방 삭제에 실패했습니다'
            );
        }
    }, []);

    const handleLeaveRoom = useCallback(async (roomId) => {
        try {
            await chatAPI.leaveRoom(roomId);
            setChatRooms(prev => prev.filter(room => room.id !== roomId));
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '채팅방 나가기에 실패했습니다'
            );
        }
    }, []);

    const handleRoomAction = useCallback(async (roomId, action) => {
        try {
            if (action === 'delete') {
                await chatAPI.deleteRoom(roomId);
            } else if (action === 'leave') {
                await chatAPI.leaveRoom(roomId);
            }
            setChatRooms(prev => prev.filter(room => room.id !== roomId));
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || `채팅방 ${action === 'delete' ? '삭제' : '나가기'}에 실패했습니다`
            );
        }
    }, []);

    const navigateToChatRoom = useCallback((roomId, roomName) => {
        navigation.navigate('ChatRoom', { roomId, roomName });
    }, [navigation]);

    const filteredChatRooms = chatRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ChatRoomItem = ({ room, isPinned }) => (
        <Pressable
            style={[styles.chatRoom, isPinned && styles.pinnedRoom]}
            onPress={() => navigateToChatRoom(room.id, room.name)}
            android_ripple={{ color: theme.colors.ripple }}
        >
            <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName} numberOfLines={1}>
                        {room.name}
                    </Text>
                    <Pressable
                        onPress={() => handlePinRoom(room.id, room.isPinned)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.pinButton}
                    >
                        <Icon
                            name={room.isPinned ? "star" : "star"}
                            size={16}
                            color={room.isPinned ? theme.colors.warning : theme.colors.inactive}
                        />
                    </Pressable>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {room.lastMessage || '새로운 채팅방입니다'}
                </Text>
            </View>
            <View style={styles.chatMeta}>
                <Text style={styles.timestamp}>
                    {room.timestamp || '방금 전'}
                </Text>
                {room.unread > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                            {room.unread > 99 ? '99+' : room.unread}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    );

    if (loading && !chatRooms.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="채팅방 검색..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        placeholderTextColor={theme.colors.textTertiary}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            <ScrollView
                style={styles.chatList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredChatRooms
                    .filter(room => room.isPinned)
                    .map(room => (
                        <ChatRoomItem
                            key={room.id}
                            room={room}
                            isPinned={true}
                        />
                    ))}
                {filteredChatRooms
                    .filter(room => !room.isPinned)
                    .map(room => (
                        <ChatRoomItem
                            key={room.id}
                            room={room}
                            isPinned={false}
                        />
                    ))}
                {!filteredChatRooms.length && !loading && (
                    <Text style={styles.emptyText}>
                        {searchQuery ? '검색 결과가 없습니다' : '채팅방이 없습니다'}
                    </Text>
                )}
            </ScrollView>
        </View>
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
    searchSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    chatList: {
        flex: 1,
    },
    chatRoom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    pinnedRoom: {
        backgroundColor: '#f8f9fa',
    },
    chatInfo: {
        flex: 1,
        marginRight: 8,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    lastMessage: {
        color: '#666',
        fontSize: 14,
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    timestamp: {
        color: '#999',
        fontSize: 12,
    },
    unreadBadge: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 32,
        fontSize: 16,
    },
    pinButton: {
        padding: 4,
    }
});

export default ChatListContent;
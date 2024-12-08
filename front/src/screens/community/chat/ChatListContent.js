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
import { theme } from '../../../styles/theme';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const ChatListContent = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [chatRooms, setChatRooms] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

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

    const fetchChatRooms = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedRooms = await AsyncStorage.getItem('chatRooms');
            if (cachedRooms) {
                setChatRooms(JSON.parse(cachedRooms));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/api/chat/rooms');
            if (response.data.success) {
                setChatRooms(response.data.rooms);
                await AsyncStorage.setItem('chatRooms', JSON.stringify(response.data.rooms));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchChatRooms();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => unsubscribe();
        }, [fetchChatRooms])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchChatRooms();
    }, [fetchChatRooms]);

    const handlePinRoom = useCallback(async (roomId, isPinned) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.put(`/api/chat/rooms/${roomId}/pin`, {
                isPinned: !isPinned
            });
            if (response.data.success) {
                await fetchChatRooms();
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '채팅방 고정에 실패했습니다'
            );
        }
    }, [fetchChatRooms]);

    const handleSearch = useCallback(async (text) => {
        setSearchQuery(text);
        if (!text.trim()) {
            await fetchChatRooms();
            return;
        }

        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.get(`/api/chat/rooms/search?query=${text}`);
            if (response.data.success) {
                setChatRooms(response.data.rooms);
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '채팅방 검색에 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [fetchChatRooms]);

    const handleRoomAction = useCallback(async (roomId, action) => {
        if (!(await checkNetwork())) return;

        try {
            if (action === 'delete') {
                await api.delete(`/api/chat/rooms/${roomId}`);
            } else if (action === 'leave') {
                await api.delete(`/api/chat/rooms/${roomId}/leave`);
            }
            setChatRooms(prev => prev.filter(room => room.id !== roomId));
            await AsyncStorage.setItem('chatRooms',
                JSON.stringify(chatRooms.filter(room => room.id !== roomId)));
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message ||
                `채팅방 ${action === 'delete' ? '삭제' : '나가기'}에 실패했습니다`
            );
        }
    }, [chatRooms]);

    const navigateToChatRoom = useCallback((roomId, roomName) => {
        navigation.navigate('ChatRoom', {
            roomId,
            roomName,
            isOnline
        });
    }, [navigation, isOnline]);

    const filteredChatRooms = chatRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ChatRoomItem = ({ room, isPinned }) => (
        <Pressable
            style={[
                styles.chatRoom,
                isPinned && styles.pinnedRoom,
                !isOnline && styles.offlineRoom
            ]}
            onPress={() => navigateToChatRoom(room.id, room.name)}
            android_ripple={{ color: theme.colors.ripple }}
            disabled={!isOnline}
        >
            <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                    <Text style={[
                        styles.chatName,
                        !isOnline && styles.offlineText
                    ]} numberOfLines={1}>
                        {room.name}
                    </Text>
                    <Pressable
                        onPress={() => handlePinRoom(room.id, room.isPinned)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.pinButton}
                        disabled={!isOnline}
                    >
                        <Icon
                            name={room.isPinned ? "star" : "star"}
                            size={16}
                            color={room.isPinned ? theme.colors.warning : theme.colors.inactive}
                        />
                    </Pressable>
                </View>
                <Text style={[
                    styles.lastMessage,
                    !isOnline && styles.offlineText
                ]} numberOfLines={1}>
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
                        editable={isOnline}
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
                        enabled={isOnline}
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
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    searchSection: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    chatList: {
        flex: 1,
    },
    chatRoom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    pinnedRoom: {
        backgroundColor: theme.colors.surface,
        opacity: 0.9,
    },
    offlineRoom: {
        opacity: 0.5,
    },
    chatInfo: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    chatName: {
        ...theme.typography.titleMedium,
        color: theme.colors.text,
        flex: 1,
    },
    lastMessage: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    offlineText: {
        color: theme.colors.textDisabled,
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    timestamp: {
        ...theme.typography.labelSmall,
        color: theme.colors.textTertiary,
    },
    unreadBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xs,
    },
    unreadCount: {
        ...theme.typography.labelSmall,
        color: theme.colors.white,
        fontWeight: 'bold',
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    pinButton: {
        padding: theme.spacing.xs,
    }
});

export default ChatListContent;
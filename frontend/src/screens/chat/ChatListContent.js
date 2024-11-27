import React, { useState, useCallback, memo } from 'react';
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
import { chatAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const ChatListContent = memo(({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [chatRooms, setChatRooms] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChatRooms = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getChatRooms();
            setChatRooms(response.data);
        } catch (error) {
            Alert.alert(
                '오류',
                '채팅방 목록을 불러오는데 실패했습니다.',
                [{ text: '확인' }]
            );
        } finally {
            setLoading(false);
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
        setRefreshing(false);
    }, [fetchChatRooms]);

    const handlePinRoom = useCallback(async (roomId, isPinned) => {
        try {
            await chatAPI.pinChatRoom(roomId, !isPinned);
            fetchChatRooms();
        } catch (error) {
            Alert.alert('오류', '채팅방 고정에 실패했습니다.');
        }
    }, [fetchChatRooms]);

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
    }, []);

    const navigateToChatRoom = useCallback((roomId, roomName) => {
        navigation.navigate('ChatRoom', {
            roomId,
            roomName
        });
    }, [navigation]);

    const filteredChatRooms = chatRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ChatRoomItem = memo(({ room, isPinned }) => (
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
    ));

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
                        <ChatRoomItem key={room.id} room={room} isPinned={true} />
                    ))}

                {filteredChatRooms
                    .filter(room => !room.isPinned)
                    .map(room => (
                        <ChatRoomItem key={room.id} room={room} isPinned={false} />
                    ))}

                {!filteredChatRooms.length && !loading && (
                    <Text style={styles.emptyText}>
                        {searchQuery ? '검색 결과가 없습니다' : '채팅방이 없습니다'}
                    </Text>
                )}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        ...theme.typography.bodyMedium,
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
    },
    pinnedRoom: {
        backgroundColor: theme.colors.surface,
    },
    chatInfo: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        flex: 1,
    },
    lastMessage: {
        color: theme.colors.textSecondary,
        ...theme.typography.bodyMedium,
    },
    chatMeta: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    timestamp: {
        color: theme.colors.textTertiary,
        ...theme.typography.bodySmall,
    },
    unreadBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        color: theme.colors.background,
        ...theme.typography.bodySmall,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xl,
        ...theme.typography.bodyLarge,
    },
    pinButton: {
        padding: theme.spacing.xs,
    },
});

ChatListContent.displayName = 'ChatListContent';

export default ChatListContent;
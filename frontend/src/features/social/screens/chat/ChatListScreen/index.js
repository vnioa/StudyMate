// features/social/screens/chat/ChatListScreen/index.js
import React, { useCallback, useMemo } from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Text
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ChatRoomItem from './components/ChatRoomItem';
import ChatFilter from './components/ChatFilter';
import { useChat } from '../../../hooks/useChat';
import styles from './styles';

const ChatListScreen = () => {
    const navigation = useNavigation();
    const {
        chatRooms,
        loading,
        error,
        isRefreshing,
        filters,
        refresh,
        updateFilter,
        markAsRead,
        deleteChat
    } = useChat();

    // 필터링된 채팅방 목록
    const filteredChatRooms = useMemo(() => {
        if (!chatRooms) return [];

        switch (filters.type) {
            case 'personal':
                return chatRooms.filter(room => !room.isGroup);
            case 'group':
                return chatRooms.filter(room => room.isGroup);
            case 'unread':
                return chatRooms.filter(room => room.unreadCount > 0);
            case 'pinned':
                return chatRooms.filter(room => room.isPinned);
            case 'archived':
                return chatRooms.filter(room => room.isArchived);
            default:
                return chatRooms;
        }
    }, [chatRooms, filters.type]);

    // 필터 변경 처리
    const handleFilterChange = useCallback((type) => {
        updateFilter({ type });
    }, [updateFilter]);

    // 채팅방 선택 처리
    const handleChatRoomPress = useCallback((chatId) => {
        navigation.navigate('ChatRoom', { chatId });
        markAsRead(chatId);
    }, [navigation, markAsRead]);

    // 채팅방 삭제 처리
    const handleDeleteChat = useCallback(async (chatId) => {
        try {
            await deleteChat(chatId);
        } catch (error) {
            console.error('Chat deletion error:', error);
        }
    }, [deleteChat]);

    // 채팅방 아이템 렌더링
    const renderItem = useCallback(({ item }) => (
        <ChatRoomItem
            room={item}
            onPress={() => handleChatRoomPress(item.id)}
            onDelete={() => handleDeleteChat(item.id)}
        />
    ), [handleChatRoomPress, handleDeleteChat]);

    // 빈 목록 표시
    const renderEmptyComponent = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {loading ? '채팅방을 불러오는 중입니다...' :
                    filters.type !== 'all' ? '해당하는 채팅방이 없습니다.' :
                        '채팅방이 없습니다.'}
            </Text>
        </View>
    ), [loading, filters.type]);

    // 구분선 렌더링
    const renderSeparator = useCallback(() => (
        <View style={styles.separator} />
    ), []);

    // 로딩 중 표시
    if (loading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0057D9" />
            </View>
        );
    }

    // 에러 표시
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    // 읽지 않은 메시지 총 개수 계산
    const totalUnreadCount = useMemo(() =>
            chatRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
        , [chatRooms]);

    return (
        <View style={styles.container}>
            <ChatFilter
                selectedFilter={filters.type}
                onFilterChange={handleFilterChange}
                unreadCount={totalUnreadCount}
            />
            <FlatList
                data={filteredChatRooms}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        colors={['#0057D9']}
                        tintColor="#0057D9"
                    />
                }
                ItemSeparatorComponent={renderSeparator}
                ListEmptyComponent={renderEmptyComponent}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
};

export default ChatListScreen;
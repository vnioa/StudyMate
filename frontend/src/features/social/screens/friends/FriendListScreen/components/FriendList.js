// features/social/screens/friend/FriendListScreen/components/FriendList.js
import React, { memo, useCallback, useState } from 'react';
import {
    View,
    FlatList,
    SectionList,
    RefreshControl,
    ActivityIndicator,
    Text,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FriendItem from './FriendItem';
import styles from '../styles';

const FriendList = ({
                        data = [],
                        refreshing = false,
                        onRefresh,
                        onFriendPress,
                        onRemoveFriend,
                        onBlockFriend,
                        loading = false,
                        sortType = 'name'  // 'name' | 'recent' | 'online'
                    }) => {
    // 상태 관리
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [viewMode, setViewMode] = useState('section'); // 'section' | 'list'

    // 섹션 데이터 생성
    const getSectionData = useCallback(() => {
        if (!data.length) return [];

        switch (sortType) {
            case 'online': {
                const online = data.filter(friend => friend.isOnline);
                const offline = data.filter(friend => !friend.isOnline);
                return [
                    { title: '온라인', data: online },
                    { title: '오프라인', data: offline }
                ].filter(section => section.data.length > 0);
            }
            case 'recent': {
                const now = new Date();
                const oneDay = 24 * 60 * 60 * 1000;
                const recent = data.filter(friend =>
                    (now - new Date(friend.lastActive)) <= oneDay
                );
                const others = data.filter(friend =>
                    (now - new Date(friend.lastActive)) > oneDay
                );
                return [
                    { title: '최근 활동', data: recent },
                    { title: '이전 활동', data: others }
                ].filter(section => section.data.length > 0);
            }
            default: {
                const sorted = [...data].sort((a, b) =>
                    a.name.localeCompare(b.name, 'ko-KR')
                );
                const sections = {};
                sorted.forEach(friend => {
                    const initial = friend.name.charAt(0);
                    if (!sections[initial]) {
                        sections[initial] = [];
                    }
                    sections[initial].push(friend);
                });
                return Object.entries(sections).map(([title, data]) => ({
                    title,
                    data
                }));
            }
        }
    }, [data, sortType]);

    // 아이템 선택 처리
    const handleSelectItem = useCallback((id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    // 섹션 헤더 렌더링
    const renderSectionHeader = useCallback(({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    ), []);

    // 친구 아이템 렌더링
    const renderFriend = useCallback(({ item }) => (
        <FriendItem
            friend={item}
            onPress={onFriendPress}
            onRemove={onRemoveFriend}
            onBlock={onBlockFriend}
            isSelected={selectedIds.has(item.id)}
            onSelect={() => handleSelectItem(item.id)}
        />
    ), [onFriendPress, onRemoveFriend, onBlockFriend, selectedIds, handleSelectItem]);

    // 구분선 렌더링
    const renderSeparator = useCallback(() => (
        <View style={styles.separator} />
    ), []);

    // 빈 목록 표시
    const renderEmpty = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {loading ? '친구 목록을 불러오는 중입니다...' : '친구 목록이 비어있습니다.'}
            </Text>
        </View>
    ), [loading]);

    // 로딩 표시
    const renderFooter = useCallback(() => {
        if (!loading) return null;
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0057D9" />
            </View>
        );
    }, [loading]);

    // 보기 모드 전환
    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'section' ? 'list' : 'section');
    }, []);

    // 리스트 헤더
    const ListHeader = useCallback(() => (
        <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
                친구 {data.length}명
            </Text>
            <TouchableOpacity onPress={toggleViewMode}>
                <Ionicons
                    name={viewMode === 'section' ? 'list' : 'grid'}
                    size={24}
                    color="#000"
                />
            </TouchableOpacity>
        </View>
    ), [data.length, viewMode, toggleViewMode]);

    if (viewMode === 'list') {
        return (
            <FlatList
                data={data}
                renderItem={renderFriend}
                ItemSeparatorComponent={renderSeparator}
                ListEmptyComponent={renderEmpty}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0057D9']}
                        tintColor="#0057D9"
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                keyExtractor={item => item.id}
            />
        );
    }

    return (
        <SectionList
            sections={getSectionData()}
            renderItem={renderFriend}
            renderSectionHeader={renderSectionHeader}
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={renderEmpty}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={renderFooter}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#0057D9']}
                    tintColor="#0057D9"
                />
            }
            stickySectionHeadersEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyExtractor={item => item.id}
        />
    );
};

FriendList.defaultProps = {
    data: [],
    refreshing: false,
    loading: false,
    sortType: 'name',
    onRefresh: null,
    onFriendPress: null,
    onRemoveFriend: null,
    onBlockFriend: null
};

export default memo(FriendList);
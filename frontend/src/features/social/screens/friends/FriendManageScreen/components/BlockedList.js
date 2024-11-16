// features/social/screens/friend/FriendManageScreen/components/BlockedList.js
import React, { memo, useCallback } from 'react';
import {
    View,
    FlatList,
    Text,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import BlockedItem from './BlockedItem';
import styles from '../styles';

const BlockedList = ({
                         data = [],
                         selectedUsers = [],
                         isEditing = false,
                         onSelect,
                         onUnblock,
                         loading = false,
                         refreshing = false,
                         onRefresh,
                         ListHeaderComponent
                     }) => {
    // 차단된 사용자 렌더링
    const renderBlockedUser = useCallback(({ item }) => (
        <BlockedItem
            user={item}
            isSelected={selectedUsers.includes(item.id)}
            isEditing={isEditing}
            onSelect={onSelect}
            onUnblock={onUnblock}
        />
    ), [isEditing, selectedUsers, onSelect, onUnblock]);

    // 구분선 렌더링
    const renderSeparator = useCallback(() => (
        <View style={styles.separator} />
    ), []);

    // 빈 목록 표시
    const renderEmpty = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {loading
                    ? '차단된 사용자 목록을 불러오는 중입니다...'
                    : '차단된 사용자가 없습니다.'
                }
            </Text>
        </View>
    ), [loading]);

    // 로딩 표시
    const renderFooter = useCallback(() => {
        if (!loading || refreshing) return null;
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0057D9" />
            </View>
        );
    }, [loading, refreshing]);

    // 헤더 렌더링
    const renderHeader = useCallback(() => {
        if (!data.length) return null;
        return (
            <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                    차단된 사용자 {data.length}명
                </Text>
                {isEditing && (
                    <Text style={styles.selectedCount}>
                        {selectedUsers.length}명 선택됨
                    </Text>
                )}
            </View>
        );
    }, [data.length, isEditing, selectedUsers.length]);

    return (
        <FlatList
            data={data}
            renderItem={renderBlockedUser}
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={renderEmpty}
            ListHeaderComponent={ListHeaderComponent || renderHeader}
            ListFooterComponent={renderFooter}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#0057D9']}
                    tintColor="#0057D9"
                />
            }
            contentContainerStyle={[
                styles.listContent,
                !data.length && styles.emptyListContent
            ]}
            keyExtractor={item => item.id}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.5}
            bounces={true}
            scrollEventThrottle={16}
        />
    );
};

BlockedList.defaultProps = {
    data: [],
    selectedUsers: [],
    isEditing: false,
    loading: false,
    refreshing: false,
    onSelect: null,
    onUnblock: null,
    onRefresh: null,
    ListHeaderComponent: null
};

export default memo(BlockedList);
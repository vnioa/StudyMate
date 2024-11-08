// src/screens/friends/FriendListScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    RefreshControl,
    SectionList,
    Animated
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function FriendListScreen() {
    const navigation = useNavigation();
    const scrollY = new Animated.Value(0);

    // 상태 관리
    const [friends, setFriends] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState(new Set());
    const [sortBy, setSortBy] = useState('name'); // name, online, recent
    const [filterBy, setFilterBy] = useState('all'); // all, online, favorite

    // 헤더 애니메이션
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [Platform.OS === 'ios' ? 130 : 110, Platform.OS === 'ios' ? 90 : 70],
        extrapolate: 'clamp'
    });

    // 친구 목록 로드
    const loadFriends = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            const response = await api.friend.getFriends();

            // 친구 목록 정렬
            const sortedFriends = sortFriends(response);

            // 섹션별로 분류
            const organizedFriends = organizeFriends(sortedFriends);

            setFriends(organizedFriends);
        } catch (error) {
            Alert.alert('오류', '친구 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 화면 포커스 시 데이터 새로고침
    useFocusEffect(
        useCallback(() => {
            loadFriends();
        }, [])
    );

    // 친구 정렬
    const sortFriends = (friendList) => {
        switch (sortBy) {
            case 'name':
                return [...friendList].sort((a, b) => a.name.localeCompare(b.name));
            case 'online':
                return [...friendList].sort((a, b) => (b.isOnline ? 1 : -1) - (a.isOnline ? 1 : -1));
            case 'recent':
                return [...friendList].sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
            default:
                return friendList;
        }
    };

    // 친구 목록 분류
    const organizeFriends = (friendList) => {
        // 필터 적용
        const filteredFriends = friendList.filter(friend => {
            if (filterBy === 'online') return friend.isOnline;
            if (filterBy === 'favorite') return friend.isFavorite;
            return true;
        });

        // 검색어 적용
        const searchedFriends = filteredFriends.filter(friend =>
            friend.name.toLowerCase().includes(searchText.toLowerCase())
        );

        // 섹션별 분류
        const favorites = searchedFriends.filter(f => f.isFavorite);
        const online = searchedFriends.filter(f => f.isOnline && !f.isFavorite);
        const offline = searchedFriends.filter(f => !f.isOnline && !f.isFavorite);

        return [
            { title: '즐겨찾기', data: favorites },
            { title: '온라인', data: online },
            { title: '오프라인', data: offline }
        ].filter(section => section.data.length > 0);
    };

    // 친구 선택 모드 토글
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedFriends(new Set());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 친구 선택/해제
    const toggleFriendSelection = (friendId) => {
        const newSelected = new Set(selectedFriends);
        if (newSelected.has(friendId)) {
            newSelected.delete(friendId);
        } else {
            newSelected.add(friendId);
        }
        setSelectedFriends(newSelected);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 친구 즐겨찾기 토글
    const toggleFavorite = async (friendId) => {
        try {
            await api.friend.toggleFavorite(friendId);
            loadFriends(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            Alert.alert('오류', '즐겨찾기 설정에 실패했습니다.');
        }
    };

    // 친구 삭제
    const handleDeleteFriends = () => {
        Alert.alert(
            '친구 삭제',
            `선택한 ${selectedFriends.size}명의 친구를 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(
                                Array.from(selectedFriends).map(id => api.friend.deleteFriend(id))
                            );
                            loadFriends();
                            setIsSelectMode(false);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            Alert.alert('오류', '친구 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 친구 아이템 렌더링
    const renderFriendItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.friendItem,
                isSelectMode && selectedFriends.has(item.id) && styles.selectedFriend
            ]}
            onPress={() => {
                if (isSelectMode) {
                    toggleFriendSelection(item.id);
                } else {
                    navigation.navigate('FriendDetail', { friendId: item.id });
                }
            }}
            onLongPress={() => {
                if (!isSelectMode) {
                    toggleSelectMode();
                    toggleFriendSelection(item.id);
                }
            }}
        >
            <Avatar
                source={{ uri: item.avatar }}
                size="medium"
                badge={item.isOnline ? 'online' : null}
            />
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name}</Text>
                {item.statusMessage && (
                    <Text style={styles.statusMessage} numberOfLines={1}>
                        {item.statusMessage}
                    </Text>
                )}
            </View>
            {!isSelectMode && (
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(item.id)}
                >
                    <Ionicons
                        name={item.isFavorite ? "star" : "star-outline"}
                        size={24}
                        color={item.isFavorite ? theme.colors.primary.main : theme.colors.text.secondary}
                    />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    // 섹션 헤더 렌더링
    const renderSectionHeader = ({ section: { title, data } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>{data.length}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>친구</Text>
                    <View style={styles.headerButtons}>
                        {isSelectMode ? (
                            <>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={handleDeleteFriends}
                                    disabled={selectedFriends.size === 0}
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={24}
                                        color={selectedFriends.size === 0
                                            ? theme.colors.text.disabled
                                            : theme.colors.status.error
                                        }
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={toggleSelectMode}
                                >
                                    <Text style={styles.cancelText}>취소</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={() => navigation.navigate('AddFriend')}
                                >
                                    <Ionicons
                                        name="person-add-outline"
                                        size={24}
                                        color={theme.colors.primary.main}
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={toggleSelectMode}
                                >
                                    <Ionicons
                                        name="checkbox-outline"
                                        size={24}
                                        color={theme.colors.primary.main}
                                    />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* 검색바 */}
                <View style={styles.searchContainer}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={theme.colors.text.secondary}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="친구 검색"
                        value={searchText}
                        onChangeText={setSearchText}
                        autoCapitalize="none"
                    />
                    {searchText !== '' && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => setSearchText('')}
                        >
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color={theme.colors.text.secondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* 필터/정렬 옵션 */}
                <View style={styles.optionsContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.optionsContent}
                    >
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                filterBy === 'all' && styles.optionButtonActive
                            ]}
                            onPress={() => setFilterBy('all')}
                        >
                            <Text style={[
                                styles.optionText,
                                filterBy === 'all' && styles.optionTextActive
                            ]}>
                                전체
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                filterBy === 'online' && styles.optionButtonActive
                            ]}
                            onPress={() => setFilterBy('online')}
                        >
                            <Text style={[
                                styles.optionText,
                                filterBy === 'online' && styles.optionTextActive
                            ]}>
                                온라인
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                filterBy === 'favorite' && styles.optionButtonActive
                            ]}
                            onPress={() => setFilterBy('favorite')}
                        >
                            <Text style={[
                                styles.optionText,
                                filterBy === 'favorite' && styles.optionTextActive
                            ]}>
                                즐겨찾기
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Animated.View>

            {/* 친구 목록 */}
            <SectionList
                sections={friends}
                renderItem={renderFriendItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadFriends(false);
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="people-outline"
                            size={48}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={styles.emptyText}>
                            {searchText
                                ? '검색 결과가 없습니다'
                                : '친구 목록이 비어있습니다'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingTop: Platform.OS === 'ios' ? 44 : 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: theme.spacing.sm,
        marginLeft: theme.spacing.sm,
    },
    cancelText: {
        fontSize: theme.typography.size.body1,
        color: theme.colors.primary.main,
        fontFamily: theme.typography.fontFamily.medium,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
        padding: 0,
    },
    clearButton: {
        padding: theme.spacing.xs,
    },
    optionsContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    optionsContent: {
        paddingRight: theme.spacing.lg,
    },
    optionButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 16,
        backgroundColor: theme.colors.grey[200],
        marginRight: theme.spacing.sm,
    },
    optionButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    optionText: {
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fontFamily.medium,
    },
    optionTextActive: {
        color: theme.colors.text.contrast,
    },
    listContent: {
        paddingBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background.secondary,
    },
    sectionTitle: {
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fontFamily.medium,
    },
    sectionCount: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fontFamily.regular,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.primary,
    },
    selectedFriend: {
        backgroundColor: theme.colors.primary.main + '10',
    },
    friendInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    friendName: {
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.medium,
        marginBottom: 2,
    },
    statusMessage: {
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fontFamily.regular,
    },
    favoriteButton: {
        padding: theme.spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl * 2,
    },
    emptyText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.secondary,
        fontFamily: theme.typography.fontFamily.medium,
        textAlign: 'center',
    }
});
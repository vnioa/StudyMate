// src/screens/group/GroupListScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    RefreshControl,
    Animated,
    Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import api from '../../services/api';

export default function GroupListScreen() {
    const navigation = useNavigation();
    const scrollY = new Animated.Value(0);

    // 상태 관리
    const [groups, setGroups] = useState({
        myGroups: [],
        joinedGroups: [],
        recommendedGroups: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, study, project, club
    const [sortBy, setSortBy] = useState('recent'); // recent, active, member
    const [isSearchMode, setIsSearchMode] = useState(false);

    // 헤더 애니메이션
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [Platform.OS === 'ios' ? 130 : 110, Platform.OS === 'ios' ? 90 : 70],
        extrapolate: 'clamp'
    });

    // 그룹 목록 로드
    const loadGroups = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);

            const [myGroupsData, joinedGroupsData, recommendedGroupsData] = await Promise.all([
                api.group.getMyGroups(),
                api.group.getJoinedGroups(),
                api.group.getRecommendedGroups()
            ]);

            // 필터 및 정렬 적용
            const filteredAndSortedGroups = {
                myGroups: filterAndSortGroups(myGroupsData),
                joinedGroups: filterAndSortGroups(joinedGroupsData),
                recommendedGroups: filterAndSortGroups(recommendedGroupsData)
            };

            setGroups(filteredAndSortedGroups);
        } catch (error) {
            Alert.alert('오류', '그룹 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 화면 포커스 시 데이터 새로고침
    useFocusEffect(
        useCallback(() => {
            loadGroups();
        }, [filterType, sortBy])
    );

    // 필터링 및 정렬
    const filterAndSortGroups = (groupList) => {
        let filtered = groupList;

        // 필터 적용
        if (filterType !== 'all') {
            filtered = filtered.filter(group => group.type === filterType);
        }

        // 검색어 적용
        if (searchText) {
            filtered = filtered.filter(group =>
                group.name.toLowerCase().includes(searchText.toLowerCase()) ||
                group.description.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // 정렬 적용
        switch (sortBy) {
            case 'recent':
                return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'active':
                return filtered.sort((a, b) => b.activityScore - a.activityScore);
            case 'member':
                return filtered.sort((a, b) => b.memberCount - a.memberCount);
            default:
                return filtered;
        }
    };

    // 그룹 참여
    const handleJoinGroup = async (groupId) => {
        try {
            await api.group.joinGroup(groupId);
            await loadGroups(false);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '그룹 참여에 실패했습니다.');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // 그룹 아이템 렌더링
    const renderGroupItem = ({ item, section }) => (
        <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.coverImage }}
                style={styles.groupImage}
                defaultSource={require('../../../assets/images/group-placeholder.png')}
            />
            <View style={styles.groupContent}>
                <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <View style={styles.groupBadge}>
                        <Text style={styles.groupType}>
                            {item.type === 'study' ? '스터디' :
                                item.type === 'project' ? '프로젝트' : '동아리'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.groupDescription} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.groupInfo}>
                    <View style={styles.groupStat}>
                        <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.groupStatText}>
                            {item.memberCount}명
                        </Text>
                    </View>
                    <View style={styles.groupStat}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.groupStatText}>
                            {date.formatRelative(item.lastActiveAt)}
                        </Text>
                    </View>
                    {item.isRecruiting && (
                        <View style={styles.recruitingBadge}>
                            <Text style={styles.recruitingText}>모집중</Text>
                        </View>
                    )}
                </View>

                {section.title === '추천 그룹' && (
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => handleJoinGroup(item.id)}
                    >
                        <Text style={styles.joinButtonText}>참여하기</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    // 섹션 헤더 렌더링
    const renderSectionHeader = ({ section }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>
                {section.data.length}개
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 헤더 */}
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>그룹</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setIsSearchMode(true)}
                        >
                            <Ionicons name="search" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('GroupCreate')}
                        >
                            <Ionicons name="add" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 검색바 */}
                {isSearchMode && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="그룹 검색"
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.searchCancel}
                            onPress={() => {
                                setSearchText('');
                                setIsSearchMode(false);
                            }}
                        >
                            <Text style={styles.searchCancelText}>취소</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 필터/정렬 옵션 */}
                <View style={styles.filterContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                filterType === 'all' && styles.filterButtonActive
                            ]}
                            onPress={() => setFilterType('all')}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                filterType === 'all' && styles.filterButtonTextActive
                            ]}>
                                전체
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                filterType === 'study' && styles.filterButtonActive
                            ]}
                            onPress={() => setFilterType('study')}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                filterType === 'study' && styles.filterButtonTextActive
                            ]}>
                                스터디
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                filterType === 'project' && styles.filterButtonActive
                            ]}
                            onPress={() => setFilterType('project')}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                filterType === 'project' && styles.filterButtonTextActive
                            ]}>
                                프로젝트
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                filterType === 'club' && styles.filterButtonActive
                            ]}
                            onPress={() => setFilterType('club')}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                filterType === 'club' && styles.filterButtonTextActive
                            ]}>
                                동아리
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Animated.View>

            {/* 그룹 목록 */}
            <SectionList
                sections={[
                    { title: '내가 만든 그룹', data: groups.myGroups },
                    { title: '참여중인 그룹', data: groups.joinedGroups },
                    { title: '추천 그룹', data: groups.recommendedGroups }
                ]}
                renderItem={renderGroupItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={item => item.id.toString()}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadGroups(false);
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
                contentContainerStyle={styles.listContent}
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
                                : '그룹이 없습니다'}
                        </Text>
                    </View>
                }
            />

            {/* 정렬 옵션 FAB */}
            <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                    Alert.alert(
                        '정렬 기준',
                        '그룹 정렬 기준을 선택하세요',
                        [
                            {
                                text: '최신순',
                                onPress: () => setSortBy('recent')
                            },
                            {
                                text: '활동순',
                                onPress: () => setSortBy('active')
                            },
                            {
                                text: '멤버순',
                                onPress: () => setSortBy('member')
                            },
                            {
                                text: '취소',
                                style: 'cancel'
                            }
                        ]
                    );
                }}
            >
                <Ionicons name="filter" size={24} color="white" />
            </TouchableOpacity>
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
        gap: theme.spacing.sm,
    },
    headerButton: {
        padding: theme.spacing.sm,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: 40,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    searchCancel: {
        marginLeft: theme.spacing.md,
    },
    searchCancelText: {
        fontSize: theme.typography.size.body1,
        color: theme.colors.primary.main,
    },
    filterContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    filterContent: {
        paddingRight: theme.spacing.lg,
    },
    filterButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.secondary,
        marginRight: theme.spacing.sm,
    },
    filterButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    filterButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    filterButtonTextActive: {
        color: theme.colors.text.contrast,
    },
    listContent: {
        paddingBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    sectionCount: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    groupItem: {
        margin: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    groupImage: {
        width: '100%',
        height: 120,
        backgroundColor: theme.colors.grey[200],
    },
    groupContent: {
        padding: theme.spacing.md,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    groupName: {
        flex: 1,
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginRight: theme.spacing.sm,
    },
    groupBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: theme.colors.primary.main + '20',
    },
    groupType: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    groupDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    groupInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupStat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    groupStatText: {
        marginLeft: 4,
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    recruitingBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: theme.colors.status.success + '20',
    },
    recruitingText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.status.success,
    },
    joinButton: {
        marginTop: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
    },
    joinButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
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
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    sortButton: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 6,
            },
        }),
    }
});
// src/screens/friends/FriendFilterScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import api from '../../services/api';

export default function FriendFilterScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { onApplyFilters } = route.params;

    // 필터 상태 관리
    const [filters, setFilters] = useState({
        status: {
            online: false,
            offline: false,
            busy: false
        },
        activity: {
            activeToday: false,
            activeThisWeek: false,
            inactive: false
        },
        relationship: {
            mutualFriends: false,
            recentlyAdded: false,
            favorite: false
        },
        study: {
            sameSubjects: false,
            activeStudyGroup: false,
            similarLevel: false
        }
    });

    // 정렬 옵션
    const [sortBy, setSortBy] = useState('name'); // name, recent, activity
    const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

    // 검색 키워드
    const [searchKeyword, setSearchKeyword] = useState('');
    const [tags, setTags] = useState([]);

    useEffect(() => {
        // 이전 필터 설정 불러오기
        loadSavedFilters();
    }, []);

    // 저장된 필터 설정 로드
    const loadSavedFilters = async () => {
        try {
            const savedFilters = await api.friend.getSavedFilters();
            if (savedFilters) {
                setFilters(savedFilters.filters);
                setSortBy(savedFilters.sortBy);
                setSortOrder(savedFilters.sortOrder);
                setTags(savedFilters.tags);
            }
        } catch (error) {
            console.error('Failed to load saved filters:', error);
        }
    };

    // 필터 적용
    const handleApplyFilters = async () => {
        try {
            // 필터 설정 저장
            await api.friend.saveFilters({
                filters,
                sortBy,
                sortOrder,
                tags
            });

            // 필터 결과 적용
            onApplyFilters({
                filters,
                sortBy,
                sortOrder,
                searchKeyword,
                tags
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
        } catch (error) {
            console.error('Failed to apply filters:', error);
        }
    };

    // 필터 초기화
    const handleResetFilters = () => {
        setFilters({
            status: {
                online: false,
                offline: false,
                busy: false
            },
            activity: {
                activeToday: false,
                activeThisWeek: false,
                inactive: false
            },
            relationship: {
                mutualFriends: false,
                recentlyAdded: false,
                favorite: false
            },
            study: {
                sameSubjects: false,
                activeStudyGroup: false,
                similarLevel: false
            }
        });
        setSortBy('name');
        setSortOrder('asc');
        setSearchKeyword('');
        setTags([]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // 태그 추가
    const handleAddTag = (tag) => {
        if (tag.trim() && !tags.includes(tag)) {
            setTags([...tags, tag.trim()]);
            setSearchKeyword('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    // 태그 삭제
    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                {/* 검색 및 태그 */}
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons
                            name="search"
                            size={20}
                            color={theme.colors.text.secondary}
                        />
                        <TextInput
                            style={styles.searchInput}
                            value={searchKeyword}
                            onChangeText={setSearchKeyword}
                            placeholder="태그 추가"
                            onSubmitEditing={() => handleAddTag(searchKeyword)}
                        />
                    </View>
                    {tags.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.tagsContainer}
                        >
                            {tags.map((tag, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.tag}
                                    onPress={() => handleRemoveTag(tag)}
                                >
                                    <Text style={styles.tagText}>{tag}</Text>
                                    <Ionicons name="close-circle" size={16} color="white" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* 상태 필터 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>상태</Text>
                    <View style={styles.filterGroup}>
                        <FilterSwitch
                            label="온라인"
                            value={filters.status.online}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    status: { ...prev.status, online: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="오프라인"
                            value={filters.status.offline}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    status: { ...prev.status, offline: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="학습 중"
                            value={filters.status.busy}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    status: { ...prev.status, busy: value }
                                }))
                            }
                        />
                    </View>
                </View>

                {/* 활동 필터 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>활동</Text>
                    <View style={styles.filterGroup}>
                        <FilterSwitch
                            label="오늘 활동"
                            value={filters.activity.activeToday}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    activity: { ...prev.activity, activeToday: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="이번 주 활동"
                            value={filters.activity.activeThisWeek}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    activity: { ...prev.activity, activeThisWeek: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="비활성"
                            value={filters.activity.inactive}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    activity: { ...prev.activity, inactive: value }
                                }))
                            }
                        />
                    </View>
                </View>

                {/* 관계 필터 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>관계</Text>
                    <View style={styles.filterGroup}>
                        <FilterSwitch
                            label="함께 아는 친구"
                            value={filters.relationship.mutualFriends}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    relationship: { ...prev.relationship, mutualFriends: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="최근 추가"
                            value={filters.relationship.recentlyAdded}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    relationship: { ...prev.relationship, recentlyAdded: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="즐겨찾기"
                            value={filters.relationship.favorite}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    relationship: { ...prev.relationship, favorite: value }
                                }))
                            }
                        />
                    </View>
                </View>

                {/* 학습 필터 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>학습</Text>
                    <View style={styles.filterGroup}>
                        <FilterSwitch
                            label="같은 과목"
                            value={filters.study.sameSubjects}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    study: { ...prev.study, sameSubjects: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="활성 스터디"
                            value={filters.study.activeStudyGroup}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    study: { ...prev.study, activeStudyGroup: value }
                                }))
                            }
                        />
                        <FilterSwitch
                            label="비슷한 레벨"
                            value={filters.study.similarLevel}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    study: { ...prev.study, similarLevel: value }
                                }))
                            }
                        />
                    </View>
                </View>

                {/* 정렬 옵션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>정렬</Text>
                    <View style={styles.sortOptions}>
                        <TouchableOpacity
                            style={[
                                styles.sortButton,
                                sortBy === 'name' && styles.sortButtonActive
                            ]}
                            onPress={() => {
                                setSortBy('name');
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Text style={[
                                styles.sortButtonText,
                                sortBy === 'name' && styles.sortButtonTextActive
                            ]}>
                                이름순
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.sortButton,
                                sortBy === 'recent' && styles.sortButtonActive
                            ]}
                            onPress={() => {
                                setSortBy('recent');
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Text style={[
                                styles.sortButtonText,
                                sortBy === 'recent' && styles.sortButtonTextActive
                            ]}>
                                최신순
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.sortButton,
                                sortBy === 'activity' && styles.sortButtonActive
                            ]}
                            onPress={() => {
                                setSortBy('activity');
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Text style={[
                                styles.sortButtonText,
                                sortBy === 'activity' && styles.sortButtonTextActive
                            ]}>
                                활동순
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.orderButton}
                        onPress={() => {
                            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Ionicons
                            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                            size={20}
                            color={theme.colors.text.primary}
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 하단 버튼 */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleResetFilters}
                >
                    <Text style={styles.resetButtonText}>초기화</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyFilters}
                >
                    <Text style={styles.applyButtonText}>적용하기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// 필터 스위치 컴포넌트
const FilterSwitch = ({ label, value, onValueChange }) => (
    <View style={styles.filterItem}>
        <Text style={styles.filterLabel}>{label}</Text>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
                false: theme.colors.grey[200],
                true: theme.colors.primary.main + '50'
            }}
            thumbColor={value
                ? theme.colors.primary.main
                : theme.colors.grey[400]
            }
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    content: {
        flex: 1,
    },
    searchSection: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        paddingHorizontal: theme.spacing.md,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    tagsContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary.main,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginRight: theme.spacing.sm,
    },
    tagText: {
        color: theme.colors.text.contrast,
        marginRight: theme.spacing.xs,
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
    },
    section: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    filterGroup: {
        gap: theme.spacing.sm,
    },
    filterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
    },
    filterLabel: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.primary,
    },
    sortOptions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    sortButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.secondary,
        alignItems: 'center',
    },
    sortButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    sortButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    sortButtonTextActive: {
        color: theme.colors.text.contrast,
    },
    orderButton: {
        alignItems: 'center',
        padding: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    resetButton: {
        flex: 1,
        padding: theme.spacing.md,
        marginRight: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    applyButton: {
        flex: 1,
        padding: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    }
});
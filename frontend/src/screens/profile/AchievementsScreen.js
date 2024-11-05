// src/screens/profile/AchievementsScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Platform,
    RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import api from '../../services/api';

export default function AchievementsScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [achievements, setAchievements] = useState({
        stats: {
            totalPoints: 0,
            rank: '',
            completedAchievements: 0,
            totalAchievements: 0
        },
        categories: [
            { id: 'study', name: '학습', progress: 0 },
            { id: 'social', name: '소셜', progress: 0 },
            { id: 'challenge', name: '도전', progress: 0 },
            { id: 'special', name: '특별', progress: 0 }
        ],
        items: []
    });
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 애니메이션 값
    const progressAnimation = new Animated.Value(0);

    // 데이터 로드
    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        try {
            setIsLoading(true);
            const response = await api.profile.getAchievements();
            setAchievements(response);

            // 진행률 애니메이션
            Animated.timing(progressAnimation, {
                toValue: response.stats.completedAchievements / response.stats.totalAchievements,
                duration: 1000,
                useNativeDriver: false
            }).start();
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 업적 달성 시 알림
    const handleAchievementUnlock = async (achievementId) => {
        try {
            await api.profile.unlockAchievement(achievementId);
            loadAchievements();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to unlock achievement:', error);
        }
    };

    // 업적 필터링
    const getFilteredAchievements = () => {
        if (selectedCategory === 'all') {
            return achievements.items;
        }
        return achievements.items.filter(item => item.category === selectedCategory);
    };

    // 업적 상세 정보 표시
    const handleShowAchievementDetail = (achievement) => {
        Alert.alert(
            achievement.name,
            achievement.description,
            [
                {
                    text: '닫기',
                    style: 'cancel'
                },
                achievement.isCompleted && {
                    text: '공유',
                    onPress: () => handleShareAchievement(achievement)
                }
            ].filter(Boolean)
        );
    };

    // 업적 공유
    const handleShareAchievement = async (achievement) => {
        try {
            await Share.share({
                message: `${achievement.name} 업적을 달성했습니다! - StudyMate`,
                url: `studymate://achievement/${achievement.id}`
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* 상단 통계 */}
            <View style={styles.statsContainer}>
                <View style={styles.statsHeader}>
                    <View>
                        <Text style={styles.totalPoints}>
                            {achievements.stats.totalPoints.toLocaleString()}점
                        </Text>
                        <Text style={styles.rank}>{achievements.stats.rank}</Text>
                    </View>
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>
                            {achievements.stats.completedAchievements} / {achievements.stats.totalAchievements}
                        </Text>
                        <View style={styles.progressBar}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: progressAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%']
                                        })
                                    }
                                ]}
                            />
                        </View>
                    </View>
                </View>

                {/* 카테고리 진행률 */}
                <View style={styles.categories}>
                    {achievements.categories.map(category => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryItem,
                                selectedCategory === category.id && styles.categoryItemActive
                            ]}
                            onPress={() => {
                                setSelectedCategory(category.id);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <View style={styles.categoryProgress}>
                                <Text style={styles.categoryPercentage}>
                                    {Math.round(category.progress * 100)}%
                                </Text>
                                <View style={styles.categoryProgressBar}>
                                    <View
                                        style={[
                                            styles.categoryProgressFill,
                                            { width: `${category.progress * 100}%` }
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text style={styles.categoryName}>{category.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 업적 목록 */}
            <ScrollView
                style={styles.achievementsList}
                contentContainerStyle={styles.achievementsContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadAchievements();
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
            >
                {getFilteredAchievements().map((achievement, index) => (
                    <TouchableOpacity
                        key={achievement.id}
                        style={[
                            styles.achievementItem,
                            achievement.isCompleted && styles.achievementItemCompleted
                        ]}
                        onPress={() => handleShowAchievementDetail(achievement)}
                    >
                        <View style={styles.achievementIcon}>
                            <Ionicons
                                name={achievement.icon}
                                size={32}
                                color={achievement.isCompleted ? achievement.color : theme.colors.text.disabled}
                            />
                        </View>
                        <View style={styles.achievementInfo}>
                            <Text style={styles.achievementName}>{achievement.name}</Text>
                            <Text style={styles.achievementDescription} numberOfLines={2}>
                                {achievement.description}
                            </Text>
                            {achievement.isCompleted ? (
                                <Text style={styles.completionDate}>
                                    달성일: {achievement.completedAt}
                                </Text>
                            ) : (
                                <View style={styles.progressInfo}>
                                    <View style={styles.achievementProgress}>
                                        <View
                                            style={[
                                                styles.achievementProgressFill,
                                                { width: `${(achievement.currentValue / achievement.targetValue) * 100}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {achievement.currentValue} / {achievement.targetValue}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {achievement.isCompleted && (
                            <View style={styles.pointsBadge}>
                                <Text style={styles.pointsText}>+{achievement.points}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    statsContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.secondary,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    totalPoints: {
        fontSize: theme.typography.size.h2,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
    },
    rank: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    progressContainer: {
        alignItems: 'flex-end',
    },
    progressText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    progressBar: {
        width: 100,
        height: 4,
        backgroundColor: theme.colors.grey[200],
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
    },
    categories: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    categoryItem: {
        flex: 1,
        minWidth: '45%',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.components.borderRadius,
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
    categoryItemActive: {
        backgroundColor: theme.colors.primary.main + '10',
    },
    categoryProgress: {
        marginBottom: theme.spacing.sm,
    },
    categoryPercentage: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
        marginBottom: theme.spacing.xs,
    },
    categoryProgressBar: {
        height: 4,
        backgroundColor: theme.colors.grey[200],
        borderRadius: 2,
        overflow: 'hidden',
    },
    categoryProgressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
    },
    categoryName: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    achievementsList: {
        flex: 1,
    },
    achievementsContent: {
        padding: theme.spacing.lg,
    },
    achievementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
        opacity: 0.7,
    },
    achievementItemCompleted: {
        opacity: 1,
    },
    achievementIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    achievementInfo: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    achievementName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    achievementDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    completionDate: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    achievementProgress: {
        flex: 1,
        height: 4,
        backgroundColor: theme.colors.grey[200],
        borderRadius: 2,
        overflow: 'hidden',
    },
    achievementProgressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
    },
    pointsBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        backgroundColor: theme.colors.primary.main + '20',
        borderRadius: 12,
    },
    pointsText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    }
});
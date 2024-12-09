import React, {useState, useCallback, memo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../api/api';

const PerformanceCard = memo(({ title, value, icon, isOnline }) => (
    <View style={[
        styles.performanceCard,
        !isOnline && styles.cardDisabled
    ]}>
        <Icon
            name={icon}
            size={24}
            color={isOnline ? theme.colors.primary : theme.colors.textDisabled}
        />
        <Text style={[
            styles.performanceValue,
            !isOnline && styles.textDisabled
        ]}>{value}</Text>
        <Text style={[
            styles.performanceTitle,
            !isOnline && styles.textDisabled
        ]}>{title}</Text>
    </View>
));

const GroupPerformanceAndRewardsScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [performanceData, setPerformanceData] = useState(null);
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

    const fetchPerformanceData = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedData = await AsyncStorage.getItem(`groupPerformance_${groupId}`);
            if (cachedData) {
                setPerformanceData(JSON.parse(cachedData));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/groups/${groupId}/performance`);
            if (response.data.success) {
                setPerformanceData(response.data.performance);
                await AsyncStorage.setItem(
                    `groupPerformance_${groupId}`,
                    JSON.stringify(response.data.performance)
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '성과 데이터를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchPerformanceData();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setPerformanceData(null);
            };
        }, [fetchPerformanceData])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPerformanceData();
    }, [fetchPerformanceData]);

    if (loading && !performanceData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>그룹 성과 및 보상</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
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
                <View style={styles.performanceGrid}>
                    <PerformanceCard
                        title="목표 달성률"
                        value={`${performanceData?.goalAchievement || 0}%`}
                        icon="target"
                        isOnline={isOnline}
                    />
                    <PerformanceCard
                        title="획득 포인트"
                        value={performanceData?.points || 0}
                        icon="award"
                        isOnline={isOnline}
                    />
                    <PerformanceCard
                        title="그룹 순위"
                        value={`${performanceData?.ranking || 0}위`}
                        icon="bar-chart-2"
                        isOnline={isOnline}
                    />
                    <PerformanceCard
                        title="획득 배지"
                        value={performanceData?.badges || 0}
                        icon="star"
                        isOnline={isOnline}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>레벨 진행도</Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${performanceData?.levelProgress || 0}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.levelText}>
                        Level {performanceData?.currentLevel || 1}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>최근 획득 배지</Text>
                    <View style={styles.badgeGrid}>
                        {performanceData?.recentBadges?.map((badge, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.badge,
                                    !isOnline && styles.badgeDisabled
                                ]}
                            >
                                <Icon
                                    name={badge.icon}
                                    size={24}
                                    color={isOnline ? theme.colors.primary : theme.colors.textDisabled}
                                />
                                <Text style={[
                                    styles.badgeTitle,
                                    !isOnline && styles.textDisabled
                                ]}>{badge.title}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>리더보드</Text>
                    {performanceData?.leaderboard?.map((member, index) => (
                        <View
                            key={index}
                            style={[
                                styles.leaderboardItem,
                                !isOnline && styles.itemDisabled
                            ]}
                        >
                            <Text style={[
                                styles.rank,
                                !isOnline && styles.textDisabled
                            ]}>#{index + 1}</Text>
                            <Text style={[
                                styles.memberName,
                                !isOnline && styles.textDisabled
                            ]}>{member.name}</Text>
                            <Text style={[
                                styles.score,
                                !isOnline && styles.textDisabled
                            ]}>{member.score}점</Text>
                        </View>
                    ))}
                </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
    },
    performanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    performanceCard: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    performanceValue: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginVertical: theme.spacing.sm,
    },
    performanceTitle: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    section: {
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.titleLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.full,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness.full,
    },
    levelText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    badge: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    badgeTitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.xs,
    },
    rank: {
        ...theme.typography.bodyLarge,
        color: theme.colors.primary,
        width: 50,
    },
    memberName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        flex: 1,
    },
    score: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
    },
    cardDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    badgeDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    itemDisabled: {
        opacity: 0.5,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

export default memo(GroupPerformanceAndRewardsScreen);
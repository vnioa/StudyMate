import React, {useState, useCallback, memo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../api/api';

const ActivityItem = memo(({ activity, isOnline }) => (
    <View style={[
        styles.activityItem,
        !isOnline && styles.itemDisabled
    ]}>
        <Image
            source={activity.image ? { uri: activity.image } : require('../../../assets/default-group.png')}
            style={styles.activityImage}
        />
        <View style={styles.activityInfo}>
            <View style={styles.activityHeader}>
                <Text style={[
                    styles.activityName,
                    !isOnline && styles.textDisabled
                ]}>
                    {activity.groupName}
                </Text>
                <Text style={[
                    styles.activityTime,
                    !isOnline && styles.textDisabled
                ]}>
                    {activity.createdAt}
                </Text>
            </View>
            <Text style={[
                styles.activityDescription,
                !isOnline && styles.textDisabled
            ]}>
                {activity.description}
            </Text>
            {activity.type === 'event' && (
                <View style={styles.eventBadge}>
                    <Ionicons
                        name="calendar"
                        size={14}
                        color={isOnline ? theme.colors.primary : theme.colors.textDisabled}
                    />
                    <Text style={[
                        styles.eventText,
                        !isOnline && styles.textDisabled
                    ]}>이벤트</Text>
                </View>
            )}
        </View>
    </View>
));

const GroupActivityScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const fetchActivities = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedActivities = await AsyncStorage.getItem(`activities_${groupId}`);
            if (cachedActivities) {
                setActivities(JSON.parse(cachedActivities));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/groups/${groupId}/activities`);
            if (response.data.success) {
                setActivities(response.data.activities);
                await AsyncStorage.setItem(
                    `activities_${groupId}`,
                    JSON.stringify(response.data.activities)
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '활동 내역을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchActivities();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setActivities([]);
            };
        }, [fetchActivities])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchActivities();
    }, [fetchActivities]);

    if (loading && !activities.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 활동</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={activities}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <ActivityItem activity={item} isOnline={isOnline} />
                )}
                contentContainerStyle={styles.activitySection}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                        enabled={isOnline}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        활동 내역이 없습니다
                    </Text>
                }
            />
        </SafeAreaView>
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
    title: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
    },
    activitySection: {
        padding: theme.spacing.md,
    },
    activityItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    itemDisabled: {
        opacity: 0.5,
    },
    activityImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: theme.spacing.md,
    },
    activityInfo: {
        flex: 1,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    activityName: {
        ...theme.typography.titleMedium,
        color: theme.colors.text,
    },
    activityTime: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    activityDescription: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    eventBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.roundness.small,
        alignSelf: 'flex-start',
    },
    eventText: {
        ...theme.typography.labelSmall,
        color: theme.colors.primary,
        marginLeft: theme.spacing.xs,
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

export default memo(GroupActivityScreen);
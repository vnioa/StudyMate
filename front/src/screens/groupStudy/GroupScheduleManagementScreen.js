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
    RefreshControl,
    TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../api/api';

const ScheduleItem = memo(({ schedule, onPress, isOnline }) => (
    <TouchableOpacity
        style={[
            styles.scheduleItem,
            !isOnline && styles.itemDisabled
        ]}
        onPress={() => onPress(schedule)}
        disabled={!isOnline}
    >
        <View style={styles.scheduleInfo}>
            <Text style={[
                styles.scheduleTitle,
                !isOnline && styles.textDisabled
            ]}>{schedule.title}</Text>
            <Text style={[
                styles.scheduleTime,
                !isOnline && styles.textDisabled
            ]}>{schedule.time}</Text>
            <Text style={[
                styles.scheduleDescription,
                !isOnline && styles.textDisabled
            ]}>{schedule.description}</Text>
        </View>
        <Icon
            name="chevron-right"
            size={20}
            color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
        />
    </TouchableOpacity>
));

const GroupScheduleManagementScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [schedules, setSchedules] = useState([]);
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

    const fetchSchedules = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedSchedules = await AsyncStorage.getItem(`groupSchedules_${groupId}`);
            if (cachedSchedules) {
                setSchedules(JSON.parse(cachedSchedules));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/groups/${groupId}/schedules`);
            if (response.data.success) {
                setSchedules(response.data.schedules);
                await AsyncStorage.setItem(
                    `groupSchedules_${groupId}`,
                    JSON.stringify(response.data.schedules)
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '일정을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchSchedules();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setSchedules([]);
            };
        }, [fetchSchedules])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSchedules();
    }, [fetchSchedules]);

    const handleAddSchedule = useCallback(() => {
        if (!isOnline) return;
        navigation.navigate('CreateSchedule', {
            groupId,
            onScheduleCreated: fetchSchedules
        });
    }, [groupId, navigation, isOnline]);

    const handleSchedulePress = useCallback((schedule) => {
        if (!isOnline) return;
        navigation.navigate('ScheduleDetail', {
            scheduleId: schedule.id,
            groupId
        });
    }, [navigation, groupId, isOnline]);

    if (loading && !schedules.length) {
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
                <Text style={styles.headerTitle}>그룹 일정 관리</Text>
                <TouchableOpacity
                    onPress={handleAddSchedule}
                    disabled={!isOnline}
                >
                    <Icon
                        name="plus"
                        size={24}
                        color={isOnline ? theme.colors.primary : theme.colors.textDisabled}
                    />
                </TouchableOpacity>
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
                {schedules.map((schedule) => (
                    <ScheduleItem
                        key={schedule.id}
                        schedule={schedule}
                        onPress={handleSchedulePress}
                        isOnline={isOnline}
                    />
                ))}
                {!schedules.length && (
                    <Text style={styles.emptyText}>
                        등록된 일정이 없습니다
                    </Text>
                )}
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
        padding: theme.spacing.md,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    scheduleInfo: {
        flex: 1,
    },
    scheduleTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    scheduleTime: {
        ...theme.typography.bodyMedium,
        color: theme.colors.primary,
        marginBottom: theme.spacing.xs,
    },
    scheduleDescription: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    itemDisabled: {
        opacity: 0.5,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

export default memo(GroupScheduleManagementScreen);
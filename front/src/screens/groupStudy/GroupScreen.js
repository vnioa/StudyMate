import React, {useState, useCallback, memo} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
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

const GroupItem = memo(({ group, onPress, isOnline }) => (
    <View style={[
        styles.groupItem,
        !isOnline && styles.itemDisabled
    ]}>
        <View style={styles.groupInfo}>
            <Text style={[
                styles.groupTitle,
                !isOnline && styles.textDisabled
            ]}>{group.title}</Text>
            <Text style={[
                styles.groupMembers,
                !isOnline && styles.textDisabled
            ]}>{group.memberCount} Members</Text>
        </View>
        <TouchableOpacity
            style={[
                styles.viewButton,
                !isOnline && styles.buttonDisabled
            ]}
            onPress={() => onPress(group)}
            disabled={!isOnline}
        >
            <Text style={[
                styles.viewButtonText,
                !isOnline && styles.textDisabled
            ]}>보기</Text>
        </TouchableOpacity>
    </View>
));

const GroupScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [groups, setGroups] = useState({
        recommended: [],
        myGroups: [],
        recentActivity: []
    });
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

    const fetchGroups = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedGroups = await AsyncStorage.getItem('groups');
            if (cachedGroups) {
                setGroups(JSON.parse(cachedGroups));
            }
            return;
        }

        try {
            setLoading(true);
            const [recommendedRes, myGroupsRes, recentActivityRes] = await Promise.all([
                api.get('/api/groups/recommended'),
                api.get('/api/groups/my'),
                api.get('/api/groups/recent-activity')
            ]);

            const newGroups = {
                recommended: recommendedRes.data.groups || [],
                myGroups: myGroupsRes.data.groups || [],
                recentActivity: recentActivityRes.data.activities || []
            };

            setGroups(newGroups);
            await AsyncStorage.setItem('groups', JSON.stringify(newGroups));
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '그룹 정보를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchGroups();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setGroups({
                    recommended: [],
                    myGroups: [],
                    recentActivity: []
                });
            };
        }, [fetchGroups])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGroups();
    }, [fetchGroups]);

    const handleSearch = useCallback(async (text) => {
        if (!text.trim()) {
            await fetchGroups();
            return;
        }

        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.get(`/api/groups/search?query=${text}`);
            if (response.data.success) {
                setGroups(prev => ({
                    ...prev,
                    recommended: response.data.groups
                }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '검색에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const navigateToGroupDetail = useCallback((group) => {
        navigation.navigate('GroupDetail', { groupId: group.id });
    }, [navigation]);

    if (loading && !groups.recommended.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
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
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>그룹</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CreateGroup')}
                        disabled={!isOnline}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons
                        name="search"
                        size={18}
                        color={theme.colors.textSecondary}
                    />
                    <TextInput
                        style={[
                            styles.searchInput,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="그룹 검색"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            handleSearch(text);
                        }}
                        editable={isOnline}
                    />
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>그룹 추천</Text>
                    {groups.recommended.map((group) => (
                        <GroupItem
                            key={group.id}
                            group={group}
                            onPress={navigateToGroupDetail}
                            isOnline={isOnline}
                        />
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>나의 그룹</Text>
                    {groups.myGroups.map((group) => (
                        <GroupItem
                            key={group.id}
                            group={group}
                            onPress={navigateToGroupDetail}
                            isOnline={isOnline}
                        />
                    ))}
                    <TouchableOpacity
                        style={[
                            styles.viewAllButton,
                            !isOnline && styles.buttonDisabled
                        ]}
                        onPress={() => navigation.navigate('MyGroup')}
                        disabled={!isOnline}
                    >
                        <Text style={[
                            styles.viewAllText,
                            !isOnline && styles.textDisabled
                        ]}>더보기</Text>
                        <Icon
                            name="chevron-right"
                            size={20}
                            color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>최근 활동</Text>
                    {groups.recentActivity.map((activity) => (
                        <View
                            key={activity.id}
                            style={[
                                styles.activityItem,
                                !isOnline && styles.itemDisabled
                            ]}
                        >
                            <Text style={[
                                styles.activityText,
                                !isOnline && styles.textDisabled
                            ]}>{activity.description}</Text>
                            <Text style={[
                                styles.activityTime,
                                !isOnline && styles.textDisabled
                            ]}>{activity.time}</Text>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[
                            styles.viewAllButton,
                            !isOnline && styles.buttonDisabled
                        ]}
                        onPress={() => navigation.navigate('GroupActivity')}
                        disabled={!isOnline}
                    >
                        <Text style={[
                            styles.viewAllText,
                            !isOnline && styles.textDisabled
                        ]}>더보기</Text>
                        <Icon
                            name="chevron-right"
                            size={20}
                            color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            !isOnline && styles.buttonDisabled
                        ]}
                        onPress={() => navigation.navigate('LearningMaterialsManagement')}
                        disabled={!isOnline}
                    >
                        <Text style={styles.actionButtonText}>학습 자료 관리</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            !isOnline && styles.buttonDisabled
                        ]}
                        onPress={() => navigation.navigate('GroupScheduleManagement')}
                        disabled={!isOnline}
                    >
                        <Text style={styles.actionButtonText}>일정 관리</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            !isOnline && styles.buttonDisabled
                        ]}
                        onPress={() => navigation.navigate('GroupPerformanceAndRewards')}
                        disabled={!isOnline}
                    >
                        <Text style={styles.actionButtonText}>성과 및 보상</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    section: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    sectionTitle: {
        ...theme.typography.titleLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    sectionContent: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    actionButton: {
        flex: 1,
        minWidth: '48%',
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    actionButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
        opacity: 0.5,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    itemDisabled: {
        opacity: 0.5,
    },
    groupTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    viewButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    viewButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
        fontWeight: '600',
    },
});

export default GroupScreen;
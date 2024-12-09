import React, {useState, useCallback, memo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Switch,
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

const GroupDetailScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [groupData, setGroupData] = useState(null);
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

    const fetchGroupData = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedData = await AsyncStorage.getItem(`group_${groupId}`);
            if (cachedData) {
                setGroupData(JSON.parse(cachedData));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/groups/${groupId}`);
            if (response.data.success) {
                setGroupData(response.data.group);
                await AsyncStorage.setItem(`group_${groupId}`,
                    JSON.stringify(response.data.group));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '그룹 정보를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchGroupData();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setGroupData(null);
            };
        }, [fetchGroupData])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGroupData();
    }, [fetchGroupData]);

    const togglePublicMode = async () => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.put(`/api/groups/${groupId}/visibility`, {
                isPublic: !groupData.isPublic
            });
            if (response.data.success) {
                setGroupData(prev => ({ ...prev, isPublic: !prev.isPublic }));
                await AsyncStorage.setItem(`group_${groupId}`,
                    JSON.stringify({ ...groupData, isPublic: !groupData.isPublic }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '설정 변경에 실패했습니다'
            );
        }
    };

    const handleFeedAction = async (actionType, feedId) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.post(`/api/groups/feeds/${feedId}/${actionType}`);
            if (response.data.success) {
                const updatedFeeds = groupData.feeds.map(feed =>
                    feed.id === feedId
                        ? { ...feed, [actionType]: response.data.count }
                        : feed
                );
                setGroupData(prev => ({ ...prev, feeds: updatedFeeds }));
                await AsyncStorage.setItem(`group_${groupId}`,
                    JSON.stringify({ ...groupData, feeds: updatedFeeds }));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '작업을 수행하는데 실패했습니다'
            );
        }
    };

    if (loading && !groupData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>그룹 상세</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('GroupSettings', { groupId })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={!isOnline}
                >
                    <Ionicons
                        name="settings-outline"
                        size={24}
                        color={isOnline ? theme.colors.text : theme.colors.textDisabled}
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
                <View style={styles.groupInfo}>
                    <Image
                        source={
                            groupData?.image
                                ? { uri: groupData.image }
                                : require('../../../assets/default-group.png')
                        }
                        style={styles.groupImage}
                    />
                    <Text style={styles.groupName}>{groupData?.name}</Text>
                    <Text style={styles.groupCategory}>{groupData?.category}</Text>
                    <Text style={styles.memberCount}>
                        {groupData?.memberCount.toLocaleString()}명의 멤버
                    </Text>
                </View>

                <View style={styles.settingSection}>
                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>공개 그룹</Text>
                        <Switch
                            value={groupData?.isPublic}
                            onValueChange={togglePublicMode}
                            disabled={!isOnline}
                            trackColor={{
                                false: theme.colors.inactive,
                                true: theme.colors.primary
                            }}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.memberManageButton,
                        !isOnline && styles.buttonDisabled
                    ]}
                    onPress={() => navigation.navigate('MemberManagement', { groupId })}
                    disabled={!isOnline}
                >
                    <Text style={[
                        styles.memberManageText,
                        !isOnline && styles.textDisabled
                    ]}>멤버 관리</Text>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                    />
                </TouchableOpacity>

                <View style={styles.feedSection}>
                    <Text style={styles.sectionTitle}>그룹 피드</Text>
                    {groupData?.feeds.map(feed => (
                        <View key={feed.id} style={styles.feedItem}>
                            {feed.image && (
                                <Image
                                    source={{ uri: feed.image }}
                                    style={styles.feedImage}
                                />
                            )}
                            <Text style={styles.feedContent}>{feed.content}</Text>
                            <View style={styles.feedMeta}>
                                <Text style={styles.feedAuthor}>{feed.author}</Text>
                                <Text style={styles.feedTime}>{feed.createdAt}</Text>
                            </View>
                            <View style={styles.feedActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleFeedAction('likes', feed.id)}
                                    disabled={!isOnline}
                                >
                                    <Ionicons
                                        name={feed.isLiked ? "heart" : "heart-outline"}
                                        size={24}
                                        color={isOnline ? theme.colors.primary : theme.colors.textDisabled}
                                    />
                                    <Text style={[
                                        styles.actionCount,
                                        !isOnline && styles.textDisabled
                                    ]}>{feed.likes}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => navigation.navigate('Comments', { feedId: feed.id })}
                                    disabled={!isOnline}
                                >
                                    <Ionicons
                                        name="chatbubble-outline"
                                        size={24}
                                        color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                                    />
                                    <Text style={[
                                        styles.actionCount,
                                        !isOnline && styles.textDisabled
                                    ]}>{feed.comments}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleFeedAction('shares', feed.id)}
                                    disabled={!isOnline}
                                >
                                    <Ionicons
                                        name="share-outline"
                                        size={24}
                                        color={isOnline ? theme.colors.text : theme.colors.textDisabled}
                                    />
                                    <Text style={[
                                        styles.actionCount,
                                        !isOnline && styles.textDisabled
                                    ]}>{feed.shares}</Text>
                                </TouchableOpacity>
                            </View>
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
    groupInfo: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    groupName: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    groupCategory: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    memberCount: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    settingSection: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingLabel: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    memberManageButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    memberManageText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    feedSection: {
        padding: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.titleLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    feedItem: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    feedImage: {
        width: '100%',
        height: 200,
    },
    feedContent: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        padding: theme.spacing.md,
    },
    feedMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    feedAuthor: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    feedTime: {
        ...theme.typography.bodySmall,
        color: theme.colors.textTertiary,
    },
    feedActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    actionCount: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    }
});

GroupDetailScreen.displayName = 'GroupDetailScreen';

export default memo(GroupDetailScreen);
import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Switch,
    ScrollView,
    Alert,
    RefreshControl,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const FeedItem = memo(({ feed, onAction }) => (
    <View style={styles.feedItem}>
        <Image
            source={{ uri: feed.image || 'https://via.placeholder.com/300' }}
            style={styles.feedImage}
            defaultSource={require('../../../assets/meeting.png')}
        />
        <Text style={styles.feedText}>{feed.content}</Text>
        <View style={styles.feedActions}>
            <TouchableOpacity onPress={() => onAction(feed.id, 'like')}>
                <Ionicons
                    name={feed.isLiked ? "heart" : "heart-outline"}
                    size={24}
                    color={feed.isLiked ? theme.colors.error : theme.colors.textSecondary}
                />
            </TouchableOpacity>
            <Text style={styles.actionText}>{feed.likeCount}</Text>

            <TouchableOpacity onPress={() => onAction(feed.id, 'comment')}>
                <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color={theme.colors.textSecondary}
                />
            </TouchableOpacity>
            <Text style={styles.actionText}>{feed.commentCount}</Text>

            <TouchableOpacity onPress={() => onAction(feed.id, 'share')}>
                <Ionicons
                    name="share-outline"
                    size={24}
                    color={theme.colors.textSecondary}
                />
            </TouchableOpacity>
            <Text style={styles.actionText}>{feed.shareCount}</Text>
        </View>
    </View>
));

const MemberItem = memo(({ member, onPress }) => (
    <TouchableOpacity style={styles.memberItem} onPress={onPress}>
        <Image
            source={{ uri: member.profileImage || 'https://via.placeholder.com/40' }}
            style={styles.memberImage}
            defaultSource={require('../../../assets/default-profile.png')}
        />
        <Text style={styles.memberName}>{member.name}</Text>
        <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
        />
    </TouchableOpacity>
));

const GroupDetailScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [groupData, setGroupData] = useState({
        name: '',
        category: '',
        memberCount: 0,
        isPublic: false,
        image: null,
        members: [],
        feeds: []
    });

    const fetchGroupDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupDetail(groupId);
            setGroupDetail(response.group);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '그룹 정보를 불러오는데 실패했습니다'
            );
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [groupId, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchGroupDetails();
            return () => {
                setGroupData({
                    name: '',
                    category: '',
                    memberCount: 0,
                    isPublic: false,
                    image: null,
                    members: [],
                    feeds: []
                });
            };
        }, [fetchGroupDetails])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGroupDetails();
        setRefreshing(false);
    }, [fetchGroupDetails]);

    const handleTogglePublic = useCallback(async (value) => {
        try {
            const response = await groupAPI.updateGroupSettings(groupId, {
                isPublic: value
            });
            if (response.data.success) {
                setGroupData(prev => ({ ...prev, isPublic: value }));
            }
        } catch (error) {
            Alert.alert('오류', '설정 변경에 실패했습니다');
        }
    }, [groupId]);

    const handleJoinGroup = useCallback(async () => {
        try {
            setJoinLoading(true);
            await groupAPI.joinGroup(groupId);

            setGroupDetail(prev => ({
                ...prev,
                isMember: true,
                memberCount: prev.memberCount + 1
            }));

            Alert.alert('성공', '그룹에 가입되었습니다.');
        } catch (error) {
            Alert.alert('오류', error.message || '그룹 가입에 실패했습니다');
        } finally {
            setJoinLoading(false);
        }
    }, [groupId]);

    const handleLeaveGroup = useCallback(async () => {
        Alert.alert(
            '그룹 나가기',
            '정말로 이 그룹을 나가시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await groupAPI.leaveGroup(groupId);

                            setGroupDetail(prev => ({
                                ...prev,
                                isMember: false,
                                memberCount: prev.memberCount - 1
                            }));

                            Alert.alert('알림', '그룹에서 나갔습니다.');
                        } catch (error) {
                            Alert.alert('오류', error.message || '그룹 나가기에 실패했습니다');
                        }
                    }
                }
            ]
        );
    }, [groupId]);

    const handleFeedAction = useCallback(async (feedId, actionType) => {
        try {
            const response = await groupAPI.handleFeedAction(groupId, feedId, actionType);
            if (response.data.success) {
                fetchGroupDetails();
            }
        } catch (error) {
            Alert.alert('오류', '작업을 수행할 수 없습니다');
        }
    }, [groupId, fetchGroupDetails]);

    return (
        <View style={styles.container}>
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
                <Text style={styles.headerTitle}>그룹 상세</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('GroupSettings', { groupId })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="settings-outline"
                        size={24}
                        color={theme.colors.text}
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
                    />
                }
            >
                {/* Group Info Section */}
                <View style={styles.groupInfo}>
                    <Image
                        source={{
                            uri: groupData.image || 'https://via.placeholder.com/100'
                        }}
                        style={styles.groupImage}
                        defaultSource={require('../../../assets/default-group.png')}
                    />
                    <Text style={styles.groupName}>{groupData.name}</Text>
                    <Text style={styles.groupDetails}>{groupData.category}</Text>
                    <Text style={styles.groupMembers}>
                        {groupData.memberCount}명의 멤버
                    </Text>
                </View>

                {/* Public Mode Toggle */}
                <View style={styles.publicMode}>
                    <Text style={styles.publicModeText}>공개 모드</Text>
                    <Switch
                        value={groupData.isPublic}
                        onValueChange={handleTogglePublic}
                        trackColor={{
                            false: theme.colors.inactive,
                            true: theme.colors.primary
                        }}
                    />
                </View>

                {/* Members Section */}
                <View style={styles.membersSection}>
                    <TouchableOpacity
                        style={styles.memberButton}
                        onPress={() => navigation.navigate('MemberManage', { groupId })}
                    >
                        <Text style={styles.memberButtonText}>멤버 관리</Text>
                    </TouchableOpacity>
                    {groupData.members.slice(0, 3).map((member) => (
                        <MemberItem
                            key={member.id}
                            member={member}
                            onPress={() => navigation.navigate('MemberProfile', {
                                memberId: member.id
                            })}
                        />
                    ))}
                </View>

                {/* Feeds Section */}
                <View style={styles.feedSection}>
                    <Text style={styles.sectionTitle}>그룹 피드</Text>
                    {groupData.feeds.map((feed) => (
                        <FeedItem
                            key={feed.id}
                            feed={feed}
                            onAction={handleFeedAction}
                        />
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
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
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    groupName: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    groupDetails: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    groupMembers: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    publicMode: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    publicModeText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    membersSection: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    memberButton: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    memberButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
    },
    memberName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        flex: 1,
    },
    feedSection: {
        padding: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    feedItem: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.md,
        overflow: 'hidden',
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    feedImage: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.surface,
    },
    feedText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        padding: theme.spacing.md,
    },
    feedActions: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    actionText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.xs,
        marginRight: theme.spacing.md,
    }
});

GroupDetailScreen.displayName = 'GroupDetailScreen';

export default memo(GroupDetailScreen);
// src/screens/group/GroupDetailScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    Platform,
    RefreshControl,
    Animated,
    Share,
    Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 250;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function GroupDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { groupId } = route.params;
    const scrollY = new Animated.Value(0);

    // 상태 관리
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userRole, setUserRole] = useState('member'); // admin, moderator, member
    const [selectedTab, setSelectedTab] = useState('info'); // info, members, activities, materials

    // 헤더 애니메이션 값
    const headerHeight = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: 'clamp'
    });

    const headerTitleOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [0, 0, 1],
        extrapolate: 'clamp'
    });

    const headerImageOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp'
    });

    // 데이터 로드
    useEffect(() => {
        loadGroupData();
    }, [groupId]);

    const loadGroupData = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);

            const [groupData, membersData, activitiesData, materialsData] = await Promise.all([
                api.group.getGroupDetail(groupId),
                api.group.getGroupMembers(groupId),
                api.group.getGroupActivities(groupId),
                api.group.getGroupMaterials(groupId)
            ]);

            setGroup(groupData);
            setMembers(membersData);
            setActivities(activitiesData);
            setMaterials(materialsData);
            setUserRole(groupData.userRole);

            // 네비게이션 헤더 설정
            navigation.setOptions({
                headerTitle: () => (
                    <Animated.Text
                        style={[
                            styles.headerTitle,
                            { opacity: headerTitleOpacity }
                        ]}
                        numberOfLines={1}
                    >
                        {groupData.name}
                    </Animated.Text>
                ),
                headerRight: () => (
                    <View style={styles.headerButtons}>
                        {userRole === 'admin' && (
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => navigation.navigate('GroupSettings', { groupId })}
                            >
                                <Ionicons name="settings-outline" size={24} color={theme.colors.text.primary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                )
            });
        } catch (error) {
            Alert.alert('오류', '그룹 정보를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // 그룹 나가기
    const handleLeaveGroup = () => {
        Alert.alert(
            '그룹 나가기',
            '정말 이 그룹을 나가시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.group.leaveGroup(groupId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('오류', '그룹 나가기에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 그룹 삭제
    const handleDeleteGroup = () => {
        Alert.alert(
            '그룹 삭제',
            '정말 이 그룹을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.group.deleteGroup(groupId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('오류', '그룹 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 그룹 공유
    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `${group.name} 그룹에 참여해보세요!`,
                url: `studymate://group/${groupId}`
            });

            if (result.action === Share.sharedAction) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    // 새 활동 시작
    const handleStartActivity = () => {
        Alert.alert(
            '활동 시작',
            '어떤 활동을 시작하시겠습니까?',
            [
                {
                    text: '스터디',
                    onPress: () => navigation.navigate('StudyTab', {
                        screen: 'GroupStudy',
                        params: { groupId }
                    })
                },
                {
                    text: '프로젝트',
                    onPress: () => navigation.navigate('GroupActivity', {
                        groupId,
                        type: 'project'
                    })
                },
                {
                    text: '토론',
                    onPress: () => navigation.navigate('GroupActivity', {
                        groupId,
                        type: 'discussion'
                    })
                },
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        );
    };

    // 멤버 관리
    const handleManageMembers = () => {
        navigation.navigate('MemberManage', { groupId });
    };

    if (isLoading || !group) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadGroupData(false);
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
            >
                {/* 그룹 정보 */}
                <View style={styles.infoSection}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupDescription}>{group.description}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{members.length}</Text>
                            <Text style={styles.statLabel}>멤버</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{activities.length}</Text>
                            <Text style={styles.statLabel}>활동</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{materials.length}</Text>
                            <Text style={styles.statLabel}>자료</Text>
                        </View>
                    </View>
                </View>

                {/* 탭 메뉴 */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === 'info' && styles.tabButtonActive
                        ]}
                        onPress={() => setSelectedTab('info')}
                    >
                        <Text style={[
                            styles.tabButtonText,
                            selectedTab === 'info' && styles.tabButtonTextActive
                        ]}>
                            정보
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === 'members' && styles.tabButtonActive
                        ]}
                        onPress={() => setSelectedTab('members')}
                    >
                        <Text style={[
                            styles.tabButtonText,
                            selectedTab === 'members' && styles.tabButtonTextActive
                        ]}>
                            멤버
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === 'activities' && styles.tabButtonActive
                        ]}
                        onPress={() => setSelectedTab('activities')}
                    >
                        <Text style={[
                            styles.tabButtonText,
                            selectedTab === 'activities' && styles.tabButtonTextActive
                        ]}>
                            활동
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === 'materials' && styles.tabButtonActive
                        ]}
                        onPress={() => setSelectedTab('materials')}
                    >
                        <Text style={[
                            styles.tabButtonText,
                            selectedTab === 'materials' && styles.tabButtonTextActive
                        ]}>
                            자료
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 탭 컨텐츠 */}
                {selectedTab === 'info' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>그룹 정보</Text>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.infoText}>
                                생성일: {date.format(group.createdAt, 'YYYY년 M월 D일')}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.infoText}>
                                그룹장: {group.owner.name}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.infoText}>
                                최근 활동: {date.formatRelative(group.lastActiveAt)}
                            </Text>
                        </View>
                        {group.tags.length > 0 && (
                            <View style={styles.tags}>
                                {group.tags.map((tag, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {selectedTab === 'members' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>멤버 목록</Text>
                            {(userRole === 'admin' || userRole === 'moderator') && (
                                <TouchableOpacity
                                    style={styles.sectionButton}
                                    onPress={handleManageMembers}
                                >
                                    <Text style={styles.sectionButtonText}>관리</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {members.map((member, index) => (
                            <TouchableOpacity
                                key={member.id}
                                style={styles.memberItem}
                                onPress={() => navigation.navigate('FriendDetail', {
                                    friendId: member.id
                                })}
                            >
                                <Avatar
                                    source={{ uri: member.avatar }}
                                    size="medium"
                                    badge={member.isOnline ? 'online' : null}
                                />
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberRole}>{member.role}</Text>
                                </View>
                                {member.isOnline && (
                                    <View style={styles.onlineBadge}>
                                        <Text style={styles.onlineText}>온라인</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {selectedTab === 'activities' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>활동 내역</Text>
                            <TouchableOpacity
                                style={styles.sectionButton}
                                onPress={handleStartActivity}
                            >
                                <Text style={styles.sectionButtonText}>새 활동</Text>
                            </TouchableOpacity>
                        </View>
                        {activities.map((activity, index) =>
                            <TouchableOpacity
                                key={activity.id}
                                style={styles.activityItem}
                                onPress={() => navigation.navigate('GroupActivity', {
                                    groupId,
                                    activityId: activity.id
                                })}
                            >
                                <View style={styles.activityIcon}>
                                    <Ionicons
                                        name={getActivityIcon(activity.type)}
                                        size={24}
                                        color={theme.colors.primary.main}
                                    />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>{activity.title}</Text>
                                    <Text style={styles.activityDescription} numberOfLines={2}>
                                        {activity.description}
                                    </Text>
                                    <View style={styles.activityMeta}>
                                        <Text style={styles.activityTime}>
                                            {date.formatRelative(activity.startTime)}
                                        </Text>
                                        <Text style={styles.activityParticipants}>
                                            참여자 {activity.participantCount}명
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {selectedTab === 'materials' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>학습 자료</Text>
                            <TouchableOpacity
                                style={styles.sectionButton}
                                onPress={() => navigation.navigate('StudyMaterial', { groupId })}
                            >
                                <Text style={styles.sectionButtonText}>자료 추가</Text>
                            </TouchableOpacity>
                        </View>
                        {materials.map((material, index) => (
                            <TouchableOpacity
                                key={material.id}
                                style={styles.materialItem}
                                onPress={() => navigation.navigate('StudyMaterial', {
                                    groupId,
                                    materialId: material.id
                                })}
                            >
                                <View style={styles.materialIcon}>
                                    <Ionicons
                                        name={getMaterialIcon(material.type)}
                                        size={24}
                                        color={theme.colors.primary.main}
                                    />
                                </View>
                                <View style={styles.materialInfo}>
                                    <Text style={styles.materialTitle}>{material.title}</Text>
                                    <Text style={styles.materialDescription} numberOfLines={1}>
                                        {material.description}
                                    </Text>
                                    <View style={styles.materialMeta}>
                                        <Text style={styles.materialUploader}>
                                            {material.uploader.name}
                                        </Text>
                                        <Text style={styles.materialTime}>
                                            {date.formatRelative(material.uploadedAt)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Animated.ScrollView>

            {/* 헤더 이미지 */}
            <Animated.Image
                source={{ uri: group.coverImage }}
                style={[
                    styles.headerImage,
                    {
                        height: headerHeight,
                        opacity: headerImageOpacity
                    }
                ]}
            />

            {/* 하단 버튼 */}
            <View style={styles.bottomButtons}>
                {userRole === 'admin' ? (
                    <>
                        <TouchableOpacity
                            style={[styles.bottomButton, styles.deleteButton]}
                            onPress={handleDeleteGroup}
                        >
                            <Text style={styles.deleteButtonText}>그룹 삭제</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.bottomButton, styles.settingsButton]}
                            onPress={() => navigation.navigate('GroupSettings', { groupId })}
                        >
                            <Text style={styles.settingsButtonText}>설정</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={[styles.bottomButton, styles.leaveButton]}
                        onPress={handleLeaveGroup}
                    >
                        <Text style={styles.leaveButtonText}>그룹 나가기</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// 활동 타입별 아이콘
const getActivityIcon = (type) => {
    switch (type) {
        case 'study':
            return 'book-outline';
        case 'project':
            return 'briefcase-outline';
        case 'discussion':
            return 'chatbubbles-outline';
        default:
            return 'ellipsis-horizontal-outline';
    }
};

// 자료 타입별 아이콘
const getMaterialIcon = (type) => {
    switch (type) {
        case 'document':
            return 'document-text-outline';
        case 'image':
            return 'image-outline';
        case 'video':
            return 'videocam-outline';
        case 'link':
            return 'link-outline';
        default:
            return 'document-outline';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.grey[200],
    },
    scrollContent: {
        paddingTop: HEADER_MAX_HEIGHT,
    },
    infoSection: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.primary,
    },
    groupName: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    groupDescription: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: theme.spacing.md,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.primary.main,
    },
    statLabel: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tabButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
    },
    tabButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary.main,
    },
    tabButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    tabButtonTextActive: {
        color: theme.colors.primary.main,
    },
    section: {
        padding: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    sectionButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
    },
    sectionButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    memberInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    memberName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    memberRole: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    activityItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    activityDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    activityMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityTime: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    activityParticipants: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    materialItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.sm,
    },
    materialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    materialInfo: {
        flex: 1,
    },
    materialTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    materialDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    materialMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    materialUploader: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    materialTime: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    bottomButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: theme.colors.status.error,
        marginRight: theme.spacing.sm,
    },
    settingsButton: {
        backgroundColor: theme.colors.primary.main,
        marginLeft: theme.spacing.sm,
    },
    leaveButton: {
        backgroundColor: theme.colors.status.error,
    },
    deleteButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    settingsButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    leaveButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    }
});
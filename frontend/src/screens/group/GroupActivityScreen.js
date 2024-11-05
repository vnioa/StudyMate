// src/screens/group/GroupActivityScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Platform,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function GroupActivityScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { groupId } = route.params;

    // 상태 관리
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedType, setSelectedType] = useState('all'); // all, study, project, discussion
    const [userRole, setUserRole] = useState('member');

    // 활동 데이터 로드
    useEffect(() => {
        loadActivities();
    }, [selectedType]);

    const loadActivities = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);

            const [activitiesData, roleData] = await Promise.all([
                api.group.getActivities(groupId, selectedType),
                api.group.getUserRole(groupId)
            ]);

            setActivities(activitiesData);
            setUserRole(roleData.role);
        } catch (error) {
            Alert.alert('오류', '활동 내역을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
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
                    onPress: () => startNewActivity('project')
                },
                {
                    text: '토론',
                    onPress: () => startNewActivity('discussion')
                },
                {
                    text: '취소',
                    style: 'cancel'
                }
            ]
        );
    };

    // 새 활동 생성
    const startNewActivity = async (type) => {
        try {
            const response = await api.group.createActivity(groupId, {
                type,
                startTime: new Date().toISOString()
            });

            setActivities(prev => [response, ...prev]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '활동 생성에 실패했습니다.');
        }
    };

    // 활동 참여
    const handleJoinActivity = async (activityId) => {
        try {
            await api.group.joinActivity(groupId, activityId);

            setActivities(prev =>
                prev.map(activity =>
                    activity.id === activityId
                        ? {
                            ...activity,
                            participantCount: activity.participantCount + 1,
                            isJoined: true
                        }
                        : activity
                )
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '활동 참여에 실패했습니다.');
        }
    };

    // 활동 종료
    const handleEndActivity = (activity) => {
        Alert.alert(
            '활동 종료',
            '이 활동을 종료하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '종료',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.group.endActivity(groupId, activity.id);

                            setActivities(prev =>
                                prev.map(a =>
                                    a.id === activity.id
                                        ? { ...a, status: 'ended', endTime: new Date().toISOString() }
                                        : a
                                )
                            );

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            Alert.alert('오류', '활동 종료에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 활동 아이템 렌더링
    const renderActivityItem = ({ item }) => (
        <TouchableOpacity
            style={styles.activityItem}
            onPress={() => {
                if (item.type === 'study') {
                    navigation.navigate('StudyTab', {
                        screen: 'GroupStudy',
                        params: { groupId, activityId: item.id }
                    });
                } else {
                    // 프로젝트나 토론 화면으로 이동
                }
            }}
        >
            <View style={styles.activityHeader}>
                <View style={styles.activityType}>
                    <Ionicons
                        name={getActivityIcon(item.type)}
                        size={24}
                        color={theme.colors.primary.main}
                    />
                    <Text style={styles.activityTypeText}>
                        {getActivityTypeText(item.type)}
                    </Text>
                </View>
                <Text style={[
                    styles.activityStatus,
                    item.status === 'active' ? styles.activeStatus : styles.endedStatus
                ]}>
                    {item.status === 'active' ? '진행중' : '종료됨'}
                </Text>
            </View>

            <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                {item.description && (
                    <Text style={styles.activityDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
            </View>

            <View style={styles.activityFooter}>
                <View style={styles.activityInfo}>
                    <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.infoText}>
                            {date.formatRelative(item.startTime)}
                            {item.endTime && ` ~ ${date.formatRelative(item.endTime)}`}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.infoText}>
                            {item.participantCount}명 참여
                        </Text>
                    </View>
                </View>

                {item.status === 'active' && (
                    <View style={styles.activityActions}>
                        {!item.isJoined ? (
                            <TouchableOpacity
                                style={styles.joinButton}
                                onPress={() => handleJoinActivity(item.id)}
                            >
                                <Text style={styles.joinButtonText}>참여하기</Text>
                            </TouchableOpacity>
                        ) : (userRole === 'admin' || item.isOwner) && (
                            <TouchableOpacity
                                style={styles.endButton}
                                onPress={() => handleEndActivity(item)}
                            >
                                <Text style={styles.endButtonText}>종료하기</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

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

    // 활동 타입 텍스트
    const getActivityTypeText = (type) => {
        switch (type) {
            case 'study':
                return '스터디';
            case 'project':
                return '프로젝트';
            case 'discussion':
                return '토론';
            default:
                return '기타';
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 필터 버튼 */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContent}
            >
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        selectedType === 'all' && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedType('all')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        selectedType === 'all' && styles.filterButtonTextActive
                    ]}>
                        전체
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        selectedType === 'study' && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedType('study')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        selectedType === 'study' && styles.filterButtonTextActive
                    ]}>
                        스터디
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        selectedType === 'project' && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedType('project')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        selectedType === 'project' && styles.filterButtonTextActive
                    ]}>
                        프로젝트
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        selectedType === 'discussion' && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedType('discussion')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        selectedType === 'discussion' && styles.filterButtonTextActive
                    ]}>
                        토론
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* 활동 목록 */}
            <FlatList
                data={activities}
                renderItem={renderActivityItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadActivities(false);
                        }}
                        colors={[theme.colors.primary.main]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="calendar-outline"
                            size={48}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={styles.emptyText}>
                            활동 내역이 없습니다
                        </Text>
                    </View>
                }
            />

            {/* 새 활동 시작 버튼 */}
            {(userRole === 'admin' || userRole === 'moderator') && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={handleStartActivity}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}

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
    filterContainer: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    filterContent: {
        padding: theme.spacing.md,
    },
    filterButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
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
        padding: theme.spacing.md,
    },
    activityItem: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
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
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    activityType: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityTypeText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
    },
    activityStatus: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeStatus: {
        backgroundColor: theme.colors.status.success + '20',
        color: theme.colors.status.success,
    },
    endedStatus: {
        backgroundColor: theme.colors.status.error + '20',
        color: theme.colors.status.error,
    },
    activityContent: {
        marginBottom: theme.spacing.md,
    },
    activityTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    activityDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    activityFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityInfo: {
        flex: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    infoText: {
        marginLeft: theme.spacing.xs,
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    activityActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    joinButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
    },
    joinButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    endButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.status.error + '20',
    },
    endButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.status.error,
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
    fab: {
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
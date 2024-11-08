// src/screens/friends/FriendDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Platform,
    Linking,
    Share
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function FriendDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { friendId } = route.params;

    // 상태 관리
    const [friend, setFriend] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mutualFriends, setMutualFriends] = useState([]);
    const [sharedGroups, setSharedGroups] = useState([]);
    const [studyHistory, setStudyHistory] = useState([]);

    // 친구 정보 로드
    useEffect(() => {
        loadFriendDetails();
    }, [friendId]);

    const loadFriendDetails = async () => {
        try {
            setIsLoading(true);
            const [friendData, mutualData, groupsData, historyData] = await Promise.all([
                api.friend.getFriendDetail(friendId),
                api.friend.getMutualFriends(friendId),
                api.friend.getSharedGroups(friendId),
                api.friend.getStudyHistory(friendId)
            ]);

            setFriend(friendData);
            setMutualFriends(mutualData);
            setSharedGroups(groupsData);
            setStudyHistory(historyData);
        } catch (error) {
            Alert.alert('오류', '친구 정보를 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    // 친구 삭제
    const handleUnfriend = () => {
        Alert.alert(
            '친구 삭제',
            '정말 이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.friend.deleteFriend(friendId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('오류', '친구 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 친구 차단
    const handleBlock = () => {
        Alert.alert(
            '친구 차단',
            '이 친구를 차단하시겠습니까?\n차단된 사용자와는 더 이상 교류할 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '차단',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.friend.blockUser(friendId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('오류', '사용자 차단에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 채팅방 생성
    const handleStartChat = async () => {
        try {
            const response = await api.chat.createRoom({
                participants: [friendId],
                type: 'personal'
            });

            navigation.navigate('ChatTab', {
                screen: 'ChatRoom',
                params: {
                    roomId: response.roomId,
                    name: friend.name
                }
            });
        } catch (error) {
            Alert.alert('오류', '채팅방 생성에 실패했습니다.');
        }
    };

    // 화상 통화 시작
    const handleVideoCall = async () => {
        try {
            const response = await api.chat.createVideoCall(friendId);
            navigation.navigate('VideoCall', {
                roomId: response.roomId,
                name: friend.name
            });
        } catch (error) {
            Alert.alert('오류', '화상 통화 연결에 실패했습니다.');
        }
    };

    // 프로필 공유
    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `${friend.name}님의 StudyMate 프로필입니다.`,
                url: `studymate://friend/${friendId}`
            });

            if (result.action === Share.sharedAction) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            Alert.alert('오류', '프로필 공유에 실패했습니다.');
        }
    };

    if (isLoading || !friend) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* 프로필 헤더 */}
                <View style={styles.profileHeader}>
                    <Avatar
                        source={{ uri: friend.avatar }}
                        size="large"
                        badge={friend.isOnline ? 'online' : null}
                    />
                    <Text style={styles.name}>{friend.name}</Text>
                    {friend.statusMessage && (
                        <Text style={styles.statusMessage}>{friend.statusMessage}</Text>
                    )}

                    {/* 빠른 액션 버튼 */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleStartChat}
                        >
                            <Ionicons name="chatbubble-outline" size={24} color={theme.colors.primary.main} />
                            <Text style={styles.actionText}>채팅</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleVideoCall}
                        >
                            <Ionicons name="videocam-outline" size={24} color={theme.colors.primary.main} />
                            <Text style={styles.actionText}>통화</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-social-outline" size={24} color={theme.colors.primary.main} />
                            <Text style={styles.actionText}>공유</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 친구 정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>
                    <View style={styles.infoItem}>
                        <Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />
                        <Text style={styles.infoText}>{friend.email}</Text>
                    </View>
                    {friend.phone && (
                        <View style={styles.infoItem}>
                            <Ionicons name="call-outline" size={20} color={theme.colors.text.secondary} />
                            <Text style={styles.infoText}>{friend.phone}</Text>
                        </View>
                    )}
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
                        <Text style={styles.infoText}>
                            친구 추가: {date.format(friend.friendSince, 'YYYY년 M월 D일')}
                        </Text>
                    </View>
                </View>

                {/* 함께 속한 그룹 */}
                {sharedGroups.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>함께 속한 그룹</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.groupsContainer}
                        >
                            {sharedGroups.map(group => (
                                <TouchableOpacity
                                    key={group.id}
                                    style={styles.groupItem}
                                    onPress={() => navigation.navigate('GroupTab', {
                                        screen: 'GroupDetail',
                                        params: { groupId: group.id }
                                    })}
                                >
                                    <Image
                                        source={{ uri: group.image }}
                                        style={styles.groupImage}
                                    />
                                    <Text style={styles.groupName}>{group.name}</Text>
                                    <Text style={styles.groupMembers}>
                                        멤버 {group.memberCount}명
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 함께 아는 친구 */}
                {mutualFriends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>함께 아는 친구</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.mutualContainer}
                        >
                            {mutualFriends.map(mutual => (
                                <TouchableOpacity
                                    key={mutual.id}
                                    style={styles.mutualItem}
                                    onPress={() => navigation.push('FriendDetail', {
                                        friendId: mutual.id
                                    })}
                                >
                                    <Avatar
                                        source={{ uri: mutual.avatar }}
                                        size="medium"
                                        badge={mutual.isOnline ? 'online' : null}
                                    />
                                    <Text style={styles.mutualName}>{mutual.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 학습 히스토리 */}
                {studyHistory.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>함께한 학습</Text>
                        {studyHistory.map(history => (
                            <View key={history.id} style={styles.historyItem}>
                                <View style={styles.historyHeader}>
                                    <Text style={styles.historyTitle}>{history.title}</Text>
                                    <Text style={styles.historyDate}>
                                        {date.formatRelative(history.date)}
                                    </Text>
                                </View>
                                <Text style={styles.historyDescription}>
                                    {history.description}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* 하단 액션 버튼 */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={[styles.bottomButton, styles.unfriendButton]}
                    onPress={handleUnfriend}
                >
                    <Ionicons name="person-remove" size={20} color={theme.colors.status.error} />
                    <Text style={[styles.bottomButtonText, styles.unfriendButtonText]}>
                        친구 삭제
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.bottomButton, styles.blockButton]}
                    onPress={handleBlock}
                >
                    <Ionicons name="ban" size={20} color={theme.colors.status.error} />
                    <Text style={[styles.bottomButtonText, styles.blockButtonText]}>
                        차단하기
                    </Text>
                </TouchableOpacity>
            </View>
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
    content: {
        paddingBottom: theme.spacing.xl,
    },
    profileHeader: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    name: {
        fontSize: theme.typography.size.h3,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
    },
    statusMessage: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        marginTop: theme.spacing.lg,
        gap: theme.spacing.xl,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.primary.main,
        marginTop: theme.spacing.xs,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    infoText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.sm,
    },
    groupsContainer: {
        paddingRight: theme.spacing.lg,
    },
    groupItem: {
        width: 120,
        marginRight: theme.spacing.md,
    },
    groupImage: {
        width: 120,
        height: 80,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.xs,
    },
    groupName: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    groupMembers: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    mutualContainer: {
        paddingRight: theme.spacing.lg,
    },
    mutualItem: {
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    mutualName: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.xs,
    },
    historyItem: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    historyTitle: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    historyDate: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    historyDescription: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
    },
    bottomActions: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    bottomButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        marginHorizontal: theme.spacing.xs,
        borderRadius: theme.layout.components.borderRadius,
        borderWidth: 1,
    },
    unfriendButton: {
        borderColor: theme.colors.status.error,
    },
    blockButton: {
        borderColor: theme.colors.status.error,
    },
    bottomButtonText: {
        marginLeft: theme.spacing.xs,
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
    },
    unfriendButtonText: {
        color: theme.colors.status.error,
    },
    blockButtonText: {
        color: theme.colors.status.error,
    }
});
// src/screens/friends/FriendRequestScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { date } from '../../utils/helpers';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function FriendRequestScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [requests, setRequests] = useState({
        received: [],
        sent: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('received'); // received, sent
    const [refreshing, setRefreshing] = useState(false);

    // 요청 목록 로드
    const loadRequests = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            const [receivedData, sentData] = await Promise.all([
                api.friend.getReceivedRequests(),
                api.friend.getSentRequests()
            ]);

            setRequests({
                received: receivedData,
                sent: sentData
            });
        } catch (error) {
            Alert.alert('오류', '친구 요청 목록을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    // 요청 수락
    const handleAccept = async (requestId) => {
        try {
            await api.friend.acceptRequest(requestId);

            // 목록 업데이트
            setRequests(prev => ({
                ...prev,
                received: prev.received.filter(req => req.id !== requestId)
            }));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '친구 요청 수락에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // 요청 거절
    const handleReject = async (requestId) => {
        try {
            await api.friend.rejectRequest(requestId);

            // 목록 업데이트
            setRequests(prev => ({
                ...prev,
                received: prev.received.filter(req => req.id !== requestId)
            }));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '친구 요청 거절에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // 보낸 요청 취소
    const handleCancel = async (requestId) => {
        Alert.alert(
            '요청 취소',
            '친구 요청을 취소하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    onPress: async () => {
                        try {
                            await api.friend.cancelRequest(requestId);

                            // 목록 업데이트
                            setRequests(prev => ({
                                ...prev,
                                sent: prev.sent.filter(req => req.id !== requestId)
                            }));

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            Alert.alert('오류', '친구 요청 취소에 실패했습니다.');
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    }
                }
            ]
        );
    };

    // 요청 아이템 렌더링
    const renderRequestItem = ({ item }) => (
        <View style={styles.requestItem}>
            <TouchableOpacity
                style={styles.userInfo}
                onPress={() => navigation.navigate('FriendDetail', { friendId: item.userId })}
            >
                <Avatar
                    source={{ uri: item.avatar }}
                    size="medium"
                    style={styles.avatar}
                />
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {item.mutualFriends > 0 && (
                        <Text style={styles.mutualFriends}>
                            함께 아는 친구 {item.mutualFriends}명
                        </Text>
                    )}
                    <Text style={styles.requestTime}>
                        {date.formatRelative(item.createdAt)}
                    </Text>
                </View>
            </TouchableOpacity>

            {activeTab === 'received' ? (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleAccept(item.id)}
                    >
                        <Text style={styles.acceptButtonText}>수락</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleReject(item.id)}
                    >
                        <Text style={styles.rejectButtonText}>거절</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancel(item.id)}
                >
                    <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 탭 버튼 */}
            <View style={styles.tabButtons}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'received' && styles.activeTabButton
                    ]}
                    onPress={() => {
                        setActiveTab('received');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'received' && styles.activeTabButtonText
                    ]}>
                        받은 요청
                        {requests.received.length > 0 && (
                            <Text style={styles.requestCount}>
                                {' '}({requests.received.length})
                            </Text>
                        )}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'sent' && styles.activeTabButton
                    ]}
                    onPress={() => {
                        setActiveTab('sent');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                >
                    <Text style={[
                        styles.tabButtonText,
                        activeTab === 'sent' && styles.activeTabButtonText
                    ]}>
                        보낸 요청
                        {requests.sent.length > 0 && (
                            <Text style={styles.requestCount}>
                                {' '}({requests.sent.length})
                            </Text>
                        )}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 요청 목록 */}
            <FlatList
                data={requests[activeTab]}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={() => {
                    setRefreshing(true);
                    loadRequests(false);
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="people-outline"
                            size={48}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={styles.emptyText}>
                            {activeTab === 'received'
                                ? '받은 친구 요청이 없습니다'
                                : '보낸 친구 요청이 없습니다'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabButtons: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tabButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary.main,
    },
    tabButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    activeTabButtonText: {
        color: theme.colors.primary.main,
    },
    requestCount: {
        color: theme.colors.primary.main,
    },
    listContent: {
        flexGrow: 1,
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        marginRight: theme.spacing.md,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    mutualFriends: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    requestTime: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.hint,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        borderWidth: 1,
    },
    acceptButton: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    rejectButton: {
        borderColor: theme.colors.text.secondary,
    },
    cancelButton: {
        borderColor: theme.colors.status.error,
    },
    acceptButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    rejectButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.secondary,
    },
    cancelButtonText: {
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
    }
});
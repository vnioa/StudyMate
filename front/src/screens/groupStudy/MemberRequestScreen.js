import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const MemberItem = memo(({ member, onAccept, onReject, isLoading }) => (
    <View style={styles.memberItem}>
        <Image
            source={{
                uri: member.profileImage || 'https://via.placeholder.com/50'
            }}
            style={styles.memberImage}
            defaultSource={require('../../../assets/default-profile.png')}
        />
        <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
            {member.message && (
                <Text style={styles.requestMessage}>"{member.message}"</Text>
            )}
        </View>
        <View style={styles.buttons}>
            <TouchableOpacity
                style={[styles.rejectButton, isLoading && styles.buttonDisabled]}
                onPress={onReject}
                disabled={isLoading}
            >
                <Text style={styles.rejectButtonText}>거절</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.acceptButton, isLoading && styles.buttonDisabled]}
                onPress={onAccept}
                disabled={isLoading}
            >
                <Text style={styles.acceptButtonText}>승인</Text>
            </TouchableOpacity>
        </View>
    </View>
));

const MemberRequestScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequests, setSelectedRequests] = useState([]);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getJoinRequests(groupId);
            setRequests(response.requests);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '가입 요청 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
            return () => {
                setRequests([]);
                setSelectedRequests([]);
            };
        }, [fetchRequests])
    );

    const handleRequest = useCallback(async (requestId, action) => {
        try {
            setActionLoading(requestId);
            if (action === 'accept') {
                await groupAPI.handleJoinRequest(groupId, requestId, action);
                const request = requests.find(req => req.id === requestId);
                await groupAPI.addGroupMember(groupId, {
                    userId: request.userId,
                    role: 'member'
                });
            } else {
                await groupAPI.handleJoinRequest(groupId, requestId, action);
            }
            
            setRequests(prev => prev.filter(req => req.id !== requestId));
            Alert.alert(
                '알림',
                action === 'accept' ? '가입 요청을 수락했습니다.' : '가입 요청을 거절했습니다.'
            );
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '요청 처리에 실패했습니다'
            );
        } finally {
            setActionLoading(null);
        }
    }, [groupId, requests]);

    const handleBulkRequests = useCallback(async (action) => {
        if (selectedRequests.length === 0) {
            Alert.alert('알림', '선택된 요청이 없습니다.');
            return;
        }

        try {
            setLoading(true);
            await groupAPI.handleBulkMemberRequests(groupId, {
                requestIds: selectedRequests,
                action
            });

            setRequests(prev => 
                prev.filter(req => !selectedRequests.includes(req.id))
            );
            setSelectedRequests([]);

            Alert.alert(
                '알림',
                action === 'accept' 
                    ? '선택한 가입 요청들을 모두 수락했습니다.' 
                    : '선택한 가입 요청들을 모두 거절했습니다.'
            );
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '일괄 처리에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId, selectedRequests]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    }, [fetchRequests]);

    const toggleRequestSelection = useCallback((requestId) => {
        setSelectedRequests(prev => 
            prev.includes(requestId)
                ? prev.filter(id => id !== requestId)
                : [...prev, requestId]
        );
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {groupName ? `${groupName} 가입 요청` : '멤버 가입 요청'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {selectedRequests.length > 0 && (
                <View style={styles.bulkActionBar}>
                    <Text style={styles.selectedCount}>
                        {selectedRequests.length}개 선택됨
                    </Text>
                    <View style={styles.bulkButtons}>
                        <TouchableOpacity
                            style={[styles.bulkButton, styles.bulkRejectButton]}
                            onPress={() => handleBulkRequests('reject')}
                        >
                            <Text style={styles.bulkButtonText}>일괄 거절</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.bulkButton, styles.bulkAcceptButton]}
                            onPress={() => handleBulkRequests('accept')}
                        >
                            <Text style={styles.bulkButtonText}>일괄 승인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FlatList
                data={requests}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onLongPress={() => toggleRequestSelection(item.id)}
                        activeOpacity={0.7}
                    >
                        <MemberItem
                            member={item}
                            onAccept={() => handleRequest(item.id, 'accept')}
                            onReject={() => handleRequest(item.id, 'reject')}
                            isLoading={actionLoading === item.id}
                            isSelected={selectedRequests.includes(item.id)}
                        />
                    </TouchableOpacity>
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        새로운 가입 요청이 없습니다
                    </Text>
                }
                contentContainerStyle={!requests.length && styles.emptyList}
            />
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
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    title: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    memberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    memberEmail: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    requestMessage: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginTop: theme.spacing.xs,
    },
    buttons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    rejectButton: {
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    acceptButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.roundness.medium,
    },
    rejectButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    acceptButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
        fontWeight: '600',
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        textAlign: 'center',
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xl,
    },
    bulkActionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    selectedCount: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    bulkButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    bulkButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.roundness.medium,
    },
    bulkRejectButton: {
        backgroundColor: theme.colors.error,
    },
    bulkAcceptButton: {
        backgroundColor: theme.colors.primary,
    },
    bulkButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

MemberRequestScreen.displayName = 'MemberRequestScreen';

export default memo(MemberRequestScreen);
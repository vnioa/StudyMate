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

const MemberItem = memo(({ member, onAccept, onReject }) => (
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
                <Text style={styles.requestMessage}>
                    "{member.message}"
                </Text>
            )}
        </View>
        <View style={styles.buttons}>
            <TouchableOpacity
                style={styles.rejectButton}
                onPress={onReject}
            >
                <Text style={styles.rejectButtonText}>거절</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.acceptButton}
                onPress={onAccept}
            >
                <Text style={styles.acceptButtonText}>승인</Text>
            </TouchableOpacity>
        </View>
    </View>
));

const MemberRequestScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [memberRequests, setMemberRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMemberRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getMemberRequests(groupId);
            if (response.data.success) {
                setMemberRequests(response.data.requests);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '가입 요청 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMemberRequests();
            return () => {
                setMemberRequests([]);
            };
        }, [fetchMemberRequests])
    );

    const handleMemberRequest = useCallback(async (memberId, status) => {
        try {
            setLoading(true);
            const response = await groupAPI.handleMemberRequest(groupId, {
                memberId,
                status
            });

            if (response.data.success) {
                setMemberRequests(prev =>
                    prev.filter(member => member.id !== memberId)
                );
                Alert.alert(
                    '성공',
                    `멤버 가입 요청을 ${status === 'accept' ? '승인' : '거절'}했습니다`
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '요청 처리에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMemberRequests();
        setRefreshing(false);
    }, [fetchMemberRequests]);

    if (loading && !memberRequests.length) {
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
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {groupName ? `${groupName} 가입 요청` : '멤버 가입 요청'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={memberRequests}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MemberItem
                        member={item}
                        onAccept={() => handleMemberRequest(item.id, 'accept')}
                        onReject={() => handleMemberRequest(item.id, 'reject')}
                    />
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        새로운 가입 요청이 없습니다
                    </Text>
                }
                contentContainerStyle={!memberRequests.length && styles.emptyList}
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
    }
});

MemberRequestScreen.displayName = 'MemberRequestScreen';

export default memo(MemberRequestScreen);
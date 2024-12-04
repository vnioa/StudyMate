import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const MemberItem = memo(({ member, onKick }) => (
    <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRole}>{member.role}</Text>
        </View>
        <TouchableOpacity
            style={styles.kickButton}
            onPress={() => onKick(member)}
        >
            <Ionicons name="remove-circle-outline" size={24} color={theme.colors.error} />
        </TouchableOpacity>
    </View>
));

const MemberKickScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupMembers(groupId);
            setMembers(response.data.members);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '멤버 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMembers();
            return () => setMembers([]);
        }, [fetchMembers])
    );

    const handleKickMember = useCallback(async (member) => {
        Alert.alert(
            '멤버 강퇴',
            `${member.name}님을 정말 강퇴하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '강퇴',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await groupAPI.removeMember(groupId, member.id);
                            Alert.alert('알림', '멤버가 강퇴되었습니다.');
                            // 멤버 목록 새로고침
                            fetchMembers();
                        } catch (error) {
                            Alert.alert(
                                '오류',
                                error.message || '멤버 강퇴에 실패했습니다'
                            );
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }, [groupId, fetchMembers]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMembers();
        setRefreshing(false);
    }, [fetchMembers]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 강퇴</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading && !members.length ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={members}
                    renderItem={({ item }) => (
                        <MemberItem
                            member={item}
                            onKick={handleKickMember}
                        />
                    )}
                    keyExtractor={item => item.id}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            강퇴할 수 있는 멤버가 없습니다
                        </Text>
                    }
                />
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: theme.spacing.md,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        fontWeight: '600',
    },
    memberRole: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    kickButton: {
        padding: theme.spacing.sm,
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    }
});

export default memo(MemberKickScreen); 
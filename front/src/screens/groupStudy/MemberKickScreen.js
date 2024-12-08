import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    Platform,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../styles/theme';

const MemberItem = memo(({ member, onKick, isAdmin }) => (
    <View style={styles.memberItem}>
        <View style={styles.memberProfile}>
            <Image
                source={member.profileImage ? { uri: member.profileImage } : require('../../../assets/sm.jpg')}
                style={styles.profileImage}
            />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role || '일반 멤버'}</Text>
            </View>
        </View>
        {isAdmin && member.role !== 'admin' && (
            <TouchableOpacity
                style={styles.kickButton}
                onPress={() => onKick(member)}
            >
                <Ionicons name="remove-circle-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
        )}
    </View>
));

const MemberKickScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userRole, setUserRole] = useState(null);

    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            const [membersResponse, roleResponse] = await Promise.all([
                axios.get(`/api/groups/${groupId}/members`),
                axios.get(`/api/groups/${groupId}/my-role`)
            ]);

            setMembers(membersResponse.data.members);
            setUserRole(roleResponse.data.role);
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '멤버 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMembers();
            return () => {
                setMembers([]);
                setUserRole(null);
            };
        }, [fetchMembers])
    );

    const handleKickMember = useCallback(async (member) => {
        if (userRole !== 'admin') {
            Alert.alert('권한 없음', '관리자만 멤버를 강퇴할 수 있습니다.');
            return;
        }

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
                            await axios.delete(`/api/groups/${groupId}/members/${member.id}`);
                            Alert.alert('완료', '멤버가 강퇴되었습니다.');
                            fetchMembers();
                        } catch (error) {
                            Alert.alert(
                                '오류',
                                error.response?.data?.message || '멤버 강퇴에 실패했습니다'
                            );
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }, [groupId, userRole, fetchMembers]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMembers();
        setRefreshing(false);
    }, [fetchMembers]);

    if (!userRole) {
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
                <Text style={styles.title}>{groupName} 멤버 관리</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={members}
                renderItem={({ item }) => (
                    <MemberItem
                        member={item}
                        onKick={handleKickMember}
                        isAdmin={userRole === 'admin'}
                    />
                )}
                keyExtractor={item => item.id}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {loading ? '멤버 목록을 불러오는 중...' : '멤버가 없습니다'}
                    </Text>
                }
            />
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
    memberProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: theme.spacing.sm,
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
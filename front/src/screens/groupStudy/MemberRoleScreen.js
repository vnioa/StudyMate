import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    Modal,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const MemberItem = memo(({ member, onPress }) => (
    <TouchableOpacity
        style={styles.memberItem}
        onPress={onPress}
    >
        <Image
            source={{
                uri: member.profileImage || 'https://via.placeholder.com/50'
            }}
            style={styles.memberImage}
            defaultSource={require('../../../assets/default-profile.png')}
        />
        <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRole}>{member.role}</Text>
            {member.joinDate && (
                <Text style={styles.memberJoinDate}>
                    가입일: {member.joinDate}
                </Text>
            )}
        </View>
        <Ionicons
            name="chevron-forward"
            size={24}
            color={theme.colors.textSecondary}
        />
    </TouchableOpacity>
));

const RoleModal = memo(({ visible, onClose, onRoleSelect, member }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
    >
        <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={onClose}
        >
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>역할 변경</Text>
                <Text style={styles.selectedMemberName}>
                    {member?.name}
                </Text>
                {['관리자', '부관리자', '멤버'].map((role) => (
                    <TouchableOpacity
                        key={role}
                        style={[
                            styles.roleOption,
                            member?.role === role && styles.currentRoleOption
                        ]}
                        onPress={() => onRoleSelect(role)}
                    >
                        <Text style={[
                            styles.roleText,
                            member?.role === role && styles.currentRoleText
                        ]}>
                            {role}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
    </Modal>
));

const MemberRoleScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupMembers(groupId);
            setMembers(response.members);
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
            return () => {
                setMembers([]);
                setSelectedMember(null);
            };
        }, [fetchMembers])
    );

    const handleRoleChange = useCallback(async (newRole) => {
        if (!selectedMember) return;

        try {
            setLoading(true);
            await groupAPI.updateMemberRole(groupId, {
                memberId: selectedMember.id,
                role: newRole
            });

            setMembers(prev => prev.map(member =>
                member.id === selectedMember.id ? { ...member, role: newRole } : member
            ));
            setShowRoleModal(false);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '역할 변경에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId, selectedMember]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMembers();
        setRefreshing(false);
    }, [fetchMembers]);

    if (loading && !members.length) {
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
                    {groupName ? `${groupName} 역할 관리` : '멤버 역할 관리'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={members}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MemberItem
                        member={item}
                        onPress={() => {
                            setSelectedMember(item);
                            setShowRoleModal(true);
                        }}
                    />
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        멤버가 없습니다
                    </Text>
                }
            />

            <RoleModal
                visible={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                onRoleSelect={handleRoleChange}
                member={selectedMember}
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
    listContainer: {
        padding: theme.spacing.md,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
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
    memberRole: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    memberJoinDate: {
        ...theme.typography.bodySmall,
        color: theme.colors.textTertiary,
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.large,
        padding: theme.spacing.lg,
        ...Platform.select({
            ios: theme.shadows.large,
            android: { elevation: 5 }
        }),
    },
    modalTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    selectedMemberName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    roleOption: {
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    currentRoleOption: {
        backgroundColor: theme.colors.surface,
    },
    roleText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        textAlign: 'center',
    },
    currentRoleText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    }
});

MemberRoleScreen.displayName = 'MemberRoleScreen';

export default memo(MemberRoleScreen);
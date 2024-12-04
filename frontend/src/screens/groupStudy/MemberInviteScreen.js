import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const MemberItem = memo(({ member, isSelected, onToggle }) => (
    <TouchableOpacity
        style={styles.memberItem}
        onPress={() => onToggle(member.id)}
    >
        <Image
            source={{
                uri: member.profileImage || 'https://via.placeholder.com/40'
            }}
            style={styles.memberImage}
            defaultSource={require('../../../assets/default-profile.png')}
        />
        <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            {member.email && (
                <Text style={styles.memberEmail}>{member.email}</Text>
            )}
        </View>
        <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
        ]}>
            {isSelected && (
                <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme.colors.white}
                />
            )}
        </View>
    </TouchableOpacity>
));

const MemberInviteScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [search, setSearch] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAvailableMembers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getAvailableMembers(groupId);
            if (response.data.success) {
                setMembers(response.data.members);
            }
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
            fetchAvailableMembers();
            return () => {
                setMembers([]);
                setSelectedMembers([]);
            };
        }, [fetchAvailableMembers])
    );

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getMemberActivities(groupId);
            setActivities(response.activities);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '활동 내역을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchActivities();
            return () => {
                setActivities([]);
            };
        }, [fetchActivities])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchActivities();
        setRefreshing(false);
    }, [fetchActivities]);

    const toggleSelectMember = useCallback((id) => {
        setSelectedMembers(prev =>
            prev.includes(id)
                ? prev.filter(memberId => memberId !== id)
                : [...prev, id]
        );
    }, []);

    const searchUsers = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setLoading(true);
            const response = await groupAPI.searchUsers(query);
            setSearchResults(response.users);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '사용자 검색에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInvite = useCallback(async () => {
        if (selectedUsers.length === 0) {
            Alert.alert('알림', '초대할 사용자를 선택해주세요.');
            return;
        }

        try {
            setSending(true);
            await groupAPI.inviteMembers(groupId, selectedUsers.map(user => user.id));

            Alert.alert(
                '초대 완료',
                `${selectedUsers.length}명의 사용자를 초대했습니다.`,
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '초대 처리 중 문제가 발생했습니다.'
            );
        } finally {
            setSending(false);
        }
    }, [groupId, selectedUsers, navigation]);

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email?.toLowerCase().includes(search.toLowerCase())
    );

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
                    {groupName ? `${groupName} 멤버 초대` : '멤버 초대'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color={theme.colors.textSecondary}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="이름 또는 이메일로 검색..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="none"
                    returnKeyType="search"
                />
            </View>

            <FlatList
                data={filteredMembers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MemberItem
                        member={item}
                        isSelected={selectedMembers.includes(item.id)}
                        onToggle={toggleSelectMember}
                    />
                )}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {search ? '검색 결과가 없습니다' : '초대 가능한 멤버가 없습니다'}
                    </Text>
                }
            />

            <TouchableOpacity
                style={[
                    styles.inviteButton,
                    (selectedMembers.length === 0 || loading) &&
                    styles.inviteButtonDisabled
                ]}
                onPress={handleInviteMembers}
                disabled={selectedMembers.length === 0 || loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.inviteButtonText}>
                        {selectedMembers.length > 0
                            ? `${selectedMembers.length}명 초대하기`
                            : '초대하기'}
                    </Text>
                )}
            </TouchableOpacity>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        ...theme.typography.bodyLarge,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    memberEmail: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    inviteButton: {
        backgroundColor: theme.colors.primary,
        margin: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    inviteButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    inviteButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    }
});

MemberInviteScreen.displayName = 'MemberInviteScreen';

export default memo(MemberInviteScreen);
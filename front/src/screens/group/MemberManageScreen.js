// src/screens/group/MemberManageScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function MemberManageScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { groupId } = route.params;

    // 상태 관리
    const [members, setMembers] = useState([]);
    const [pendingMembers, setPendingMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [userRole, setUserRole] = useState('admin');
    const [selectedTab, setSelectedTab] = useState('members'); // members, pending

    // 데이터 로드
    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setIsLoading(true);
            const [membersData, pendingData, roleData] = await Promise.all([
                api.group.getGroupMembers(groupId),
                api.group.getPendingMembers(groupId),
                api.group.getUserRole(groupId)
            ]);

            setMembers(membersData);
            setPendingMembers(pendingData);
            setUserRole(roleData.role);
        } catch (error) {
            Alert.alert('오류', '멤버 목록을 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    // 역할 변경
    const handleRoleChange = async (memberId, newRole) => {
        try {
            await api.group.updateMemberRole(groupId, memberId, newRole);
            setMembers(prev =>
                prev.map(member =>
                    member.id === memberId
                        ? { ...member, role: newRole }
                        : member
                )
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', '역할 변경에 실패했습니다.');
        }
    };

    // 멤버 추방
    const handleKickMember = (member) => {
        Alert.alert(
            '멤버 추방',
            `${member.name}님을 그룹에서 추방하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '추방',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.group.kickMember(groupId, member.id);
                            setMembers(prev =>
                                prev.filter(m => m.id !== member.id)
                            );
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            Alert.alert('오류', '멤버 추방에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 가입 요청 처리
    const handleJoinRequest = async (memberId, accept) => {
        try {
            if (accept) {
                await api.group.acceptJoinRequest(groupId, memberId);
                const newMember = pendingMembers.find(m => m.id === memberId);
                setMembers(prev => [...prev, { ...newMember, role: 'member' }]);
            } else {
                await api.group.rejectJoinRequest(groupId, memberId);
            }

            setPendingMembers(prev =>
                prev.filter(m => m.id !== memberId)
            );

            Haptics.notificationAsync(
                accept
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Warning
            );
        } catch (error) {
            Alert.alert('오류', '요청 처리에 실패했습니다.');
        }
    };

    // 멤버 아이템 렌더링
    const renderMemberItem = ({ item }) => (
        <View style={styles.memberItem}>
            <TouchableOpacity
                style={styles.memberInfo}
                onPress={() => navigation.navigate('FriendDetail', { friendId: item.id })}
            >
                <Avatar
                    source={{ uri: item.avatar }}
                    size="medium"
                    badge={item.isOnline ? 'online' : null}
                />
                <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberRole}>{item.role}</Text>
                </View>
            </TouchableOpacity>

            {userRole === 'admin' && item.role !== 'admin' && (
                <View style={styles.memberActions}>
                    <TouchableOpacity
                        style={styles.roleButton}
                        onPress={() => {
                            Alert.alert(
                                '역할 변경',
                                `${item.name}님의 역할을 선택하세요`,
                                [
                                    { text: '취소', style: 'cancel' },
                                    {
                                        text: '관리자',
                                        onPress: () => handleRoleChange(item.id, 'admin')
                                    },
                                    {
                                        text: '모더레이터',
                                        onPress: () => handleRoleChange(item.id, 'moderator')
                                    },
                                    {
                                        text: '멤버',
                                        onPress: () => handleRoleChange(item.id, 'member')
                                    }
                                ]
                            );
                        }}
                    >
                        <Ionicons name="settings-outline" size={24} color={theme.colors.primary.main} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.kickButton}
                        onPress={() => handleKickMember(item)}
                    >
                        <Ionicons name="exit-outline" size={24} color={theme.colors.status.error} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    // 가입 요청 아이템 렌더링
    const renderPendingItem = ({ item }) => (
        <View style={styles.pendingItem}>
            <View style={styles.memberInfo}>
                <Avatar
                    source={{ uri: item.avatar }}
                    size="medium"
                />
                <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    {item.message && (
                        <Text style={styles.requestMessage} numberOfLines={2}>
                            {item.message}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.requestActions}>
                <TouchableOpacity
                    style={[styles.requestButton, styles.acceptButton]}
                    onPress={() => handleJoinRequest(item.id, true)}
                >
                    <Text style={styles.acceptButtonText}>수락</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.requestButton, styles.rejectButton]}
                    onPress={() => handleJoinRequest(item.id, false)}
                >
                    <Text style={styles.rejectButtonText}>거절</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 검색바 */}
            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color={theme.colors.text.secondary}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="멤버 검색"
                />
                {searchText !== '' && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchText('')}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={theme.colors.text.secondary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* 탭 버튼 */}
            <View style={styles.tabButtons}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === 'members' && styles.tabButtonActive
                    ]}
                    onPress={() => {
                        setSelectedTab('members');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                >
                    <Text style={[
                        styles.tabButtonText,
                        selectedTab === 'members' && styles.tabButtonTextActive
                    ]}>
                        멤버 ({members.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === 'pending' && styles.tabButtonActive
                    ]}
                    onPress={() => {
                        setSelectedTab('pending');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                >
                    <Text style={[
                        styles.tabButtonText,
                        selectedTab === 'pending' && styles.tabButtonTextActive
                    ]}>
                        가입 요청 ({pendingMembers.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 멤버 목록 */}
            <FlatList
                data={selectedTab === 'members'
                    ? members.filter(member =>
                        member.name.toLowerCase().includes(searchText.toLowerCase())
                    )
                    : pendingMembers
                }
                renderItem={selectedTab === 'members' ? renderMemberItem : renderPendingItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="people-outline"
                            size={48}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={styles.emptyText}>
                            {selectedTab === 'members'
                                ? '멤버가 없습니다'
                                : '가입 요청이 없습니다'}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    clearButton: {
        padding: theme.spacing.xs,
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
    listContent: {
        flexGrow: 1,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberDetails: {
        marginLeft: theme.spacing.md,
    },
    memberName: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    memberRole: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
    },
    memberActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.sm,
    },
    kickButton: {
        padding: theme.spacing.sm,
    },
    pendingItem: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    requestMessage: {
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    requestActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    requestButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
    },
    acceptButton: {
        backgroundColor: theme.colors.primary.main,
    },
    rejectButton: {
        backgroundColor: theme.colors.background.secondary,
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
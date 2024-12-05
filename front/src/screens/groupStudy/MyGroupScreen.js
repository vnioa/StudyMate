import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const StatItem = memo(({ label, value }) => (
    <View style={styles.statItem}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
));

const MyGroupScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [groupData, setGroupData] = useState({
        name: '',
        memberCount: 0,
        eventCount: 0,
        imageUrl: '',
        members: []
    });

    const fetchGroupData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupDetails(groupId);
            if (response.data.success) {
                setGroupData(response.data.group);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '그룹 정보를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchGroupData();
            return () => {
                setGroupData({
                    name: '',
                    memberCount: 0,
                    eventCount: 0,
                    imageUrl: '',
                    members: []
                });
            };
        }, [fetchGroupData])
    );

    const handleMemberInvite = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.createInvitation(groupId);
            if (response.data.success) {
                navigation.navigate('MemberInvite', {
                    groupId,
                    groupName,
                    inviteCode: response.data.inviteCode
                });
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '초대 코드 생성에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId, navigation, groupName]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchGroupData();
        setRefreshing(false);
    }, [fetchGroupData]);

    if (loading && !groupData.name) {
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
                    {groupName || '나의 그룹'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.groupInfo}>
                    <Image
                        source={{
                            uri: groupData.imageUrl || 'https://via.placeholder.com/100'
                        }}
                        style={styles.groupImage}
                        defaultSource={require('../../../assets/default-group.png')}
                    />
                    <Text style={styles.groupName}>{groupData.name}</Text>
                    <View style={styles.stats}>
                        <StatItem
                            label="멤버"
                            value={groupData.memberCount}
                        />
                        <StatItem
                            label="주간 스터디"
                            value={groupData.eventCount}
                        />
                    </View>
                </View>

                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('MemberView', {
                            groupId,
                            groupName
                        })}
                    >
                        <Text style={styles.buttonText}>멤버 보기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.inviteButton]}
                        onPress={handleMemberInvite}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.white} />
                        ) : (
                            <Text style={styles.buttonText}>멤버 초대</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.memberSection}>
                    <Text style={styles.memberTitle}>멤버</Text>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => navigation.navigate('MemberManage', {
                            groupId,
                            groupName
                        })}
                    >
                        <Text style={styles.confirmText}>관리</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    content: {
        flex: 1,
    },
    groupInfo: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    groupName: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    stats: {
        flexDirection: 'row',
        gap: theme.spacing.xl,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    statLabel: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: theme.spacing.md,
    },
    button: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        marginHorizontal: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    inviteButton: {
        backgroundColor: theme.colors.primary,
        borderWidth: 0,
    },
    buttonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    memberSection: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    memberTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    confirmText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    }
});

MyGroupScreen.displayName = 'MyGroupScreen';

export default memo(MyGroupScreen);
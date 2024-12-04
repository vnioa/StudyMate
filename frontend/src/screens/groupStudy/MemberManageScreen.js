import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const OptionItem = memo(({ option, onPress }) => (
    <TouchableOpacity
        style={styles.optionItem}
        onPress={onPress}
    >
        <View style={styles.optionLeft}>
            <Ionicons
                name={option.icon}
                size={24}
                color={theme.colors.textSecondary}
            />
            <Text style={styles.optionText}>{option.title}</Text>
        </View>
        <View style={styles.optionRight}>
            {option.badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {option.badge > 99 ? '99+' : option.badge}
                    </Text>
                </View>
            )}
            <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
            />
        </View>
    </TouchableOpacity>
));

const MemberManageScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [loading, setLoading] = useState(false);
    const [groupInfo, setGroupInfo] = useState(null);

    const fetchGroupInfo = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupDetails(groupId);
            setGroupInfo(response.group);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '그룹 정보를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchGroupInfo();
            return () => {
                setGroupInfo(null);
            };
        }, [fetchGroupInfo])
    );

    const handleNavigate = useCallback((screen) => {
        navigation.navigate(screen, {
            groupId,
            groupName: groupInfo?.name || groupName
        });
    }, [navigation, groupId, groupInfo, groupName]);

    const options = [
        {
            title: '초기 멤버 초대',
            screen: 'MemberInvite',
            icon: 'person-add-outline',
            onPress: () => handleNavigate('MemberInvite')
        },
        {
            title: '멤버 가입 요청',
            screen: 'MemberRequest',
            icon: 'people-outline',
            badge: groupInfo?.pendingRequests || 0,
            onPress: () => handleNavigate('MemberRequest')
        },
        {
            title: '멤버 역할 부여 및 권한 관리',
            screen: 'MemberRole',
            icon: 'settings-outline',
            onPress: () => handleNavigate('MemberRole')
        },
        {
            title: '멤버 활동 내역 조회',
            screen: 'MemberActivity',
            icon: 'analytics-outline',
            onPress: () => handleNavigate('MemberActivity')
        },
        {
            title: '멘토링',
            screen: 'Mentoring',
            icon: 'school-outline',
            onPress: () => handleNavigate('Mentoring')
        }
    ];

    if (loading && !groupInfo) {
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
                    {groupName ? `${groupName} 멤버 관리` : '멤버 관리'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {options.map((option, index) => (
                    <OptionItem
                        key={index}
                        option={option}
                        onPress={option.onPress}
                    />
                ))}
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
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginLeft: theme.spacing.md,
    },
    optionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: theme.colors.error,
        borderRadius: theme.roundness.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    badgeText: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
        fontWeight: '600',
        paddingHorizontal: theme.spacing.xs,
    }
});

MemberManageScreen.displayName = 'MemberManageScreen';

export default memo(MemberManageScreen);
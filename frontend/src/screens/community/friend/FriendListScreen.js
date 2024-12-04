import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import FriendsListContent from './FriendListContent';
import { friendsAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const HeaderButton = memo(({ icon, onPress }) => (
    <Pressable
        style={styles.headerButton}
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
        <Icon name={icon} size={24} color={theme.colors.text} />
    </Pressable>
));

const FriendsListScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [unreadRequests, setUnreadRequests] = useState(0);

    const fetchFriendRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await friendsAPI.getFriendRequests();
            setUnreadRequests(response.requests?.length || 0); // .data.success 제거
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '친구 요청을 불러오는데 실패했습니다'
            );
            setUnreadRequests(0); // 에러 발생 시 초기화
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchFriendRequests();
            return () => {
                setUnreadRequests(0);
            };
        }, [fetchFriendRequests])
    );

    const handleAddFriend = useCallback(() => {
        navigation.navigate('AddFriend');
    }, [navigation]);

    const handleSettings = useCallback(() => {
        navigation.navigate('FriendsSettings');
    }, [navigation]);

    if (loading && !unreadRequests) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>친구</Text>
                    {unreadRequests > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadRequests > 99 ? '99+' : unreadRequests}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <HeaderButton
                        icon="user-plus"
                        onPress={handleAddFriend}
                    />
                    <HeaderButton
                        icon="settings"
                        onPress={handleSettings}
                    />
                </View>
            </View>
            <FriendsListContent
                navigation={navigation}
                onRefresh={fetchFriendRequests}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    headerButton: {
        padding: theme.spacing.xs,
        borderRadius: theme.roundness.small,
    },
    badge: {
        backgroundColor: theme.colors.error,
        borderRadius: theme.roundness.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
    },
    badgeText: {
        color: theme.colors.white,
        ...theme.typography.bodySmall,
        fontWeight: '600',
    }
});

FriendsListScreen.displayName = 'FriendsListScreen';

export default memo(FriendsListScreen);
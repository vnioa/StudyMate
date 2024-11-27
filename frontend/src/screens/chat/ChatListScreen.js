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
import ChatListContent from './ChatListContent';
import { chatAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const ChatListScreen = memo(({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getUnreadCount();
            setUnreadCount(response.data.count || 0);
        } catch (error) {
            Alert.alert(
                '오류',
                '알림을 불러오는데 실패했습니다.',
                [{ text: '확인' }]
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();

            return () => {
                setUnreadCount(0);
            };
        }, [fetchUnreadCount])
    );

    const handleNewChat = useCallback(() => {
        if (loading) return;
        navigation.navigate('NewChat');
    }, [loading, navigation]);

    const HeaderBadge = memo(({ count }) => {
        if (count <= 0) return null;

        return (
            <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                    {count > 99 ? '99+' : count}
                </Text>
            </View>
        );
    });

    const HeaderRight = memo(({ onPress, disabled }) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed
            ]}
            disabled={disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Icon
                name="edit"
                size={24}
                color={disabled ? theme.colors.disabled : theme.colors.text}
            />
        </Pressable>
    ));

    if (loading && !unreadCount) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>채팅</Text>
                <HeaderBadge count={unreadCount} />
                <HeaderRight
                    onPress={handleNewChat}
                    disabled={loading}
                />
            </View>
            <ChatListContent
                navigation={navigation}
                onRefresh={fetchUnreadCount}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    badgeContainer: {
        position: 'absolute',
        top: theme.spacing.xs,
        right: 45,
        backgroundColor: theme.colors.error,
        borderRadius: theme.roundness.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xs,
    },
    badgeText: {
        color: theme.colors.white,
        ...theme.typography.bodySmall,
        fontWeight: '600',
    },
    iconButton: {
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.surface,
    },
    iconButtonPressed: {
        opacity: 0.7,
        backgroundColor: theme.colors.pressed,
    }
});

ChatListScreen.displayName = 'ChatListScreen';

export default ChatListScreen;
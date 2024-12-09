import React, { useState, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../../styles/theme';
import api from '../../../api/api';

const ChatListScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const fetchUnreadCount = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedCount = await AsyncStorage.getItem('lastUnreadCount');
            if (cachedCount) {
                setUnreadCount(JSON.parse(cachedCount));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/api/chat/unread-count');
            if (response.data.success) {
                setUnreadCount(response.data.unreadCount || 0);
                await AsyncStorage.setItem('lastUnreadCount',
                    JSON.stringify(response.data.unreadCount));
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '알림을 불러오는데 실패했습니다.',
                [{ text: '확인' }]
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const handleNewChat = async () => {
        if (loading || !(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.post('/api/chat/rooms', {
                type: 'individual'
            });
            if (response.data.success) {
                navigation.navigate('ChatRoom', {
                    roomId: response.data.roomId,
                    isNewChat: true
                });
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '채팅방 생성에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });

            return () => {
                clearInterval(interval);
                unsubscribe();
                setUnreadCount(0);
            };
        }, [fetchUnreadCount])
    );

    const HeaderBadge = ({ count }) => {
        if (count <= 0) return null;

        return (
            <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                    {count > 99 ? '99+' : count}
                </Text>
            </View>
        );
    };

    const HeaderRight = ({ onPress, disabled }) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
                disabled && styles.iconButtonDisabled
            ]}
            disabled={disabled || !isOnline}
            hitSlop={20}
        >
            <Icon
                name="edit"
                size={24}
                color={disabled || !isOnline ? theme.colors.textDisabled : theme.colors.text}
            />
        </Pressable>
    );

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
                isOnline={isOnline}
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
        backgroundColor: theme.colors.background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
    },
    badgeContainer: {
        position: 'absolute',
        top: theme.spacing.sm,
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
        ...theme.typography.labelSmall,
        color: theme.colors.white,
        fontWeight: 'bold',
    },
    iconButton: {
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.surface,
    },
    iconButtonPressed: {
        opacity: 0.7,
        backgroundColor: theme.colors.pressed,
    },
    iconButtonDisabled: {
        opacity: 0.5,
    }
});

export default ChatListScreen;
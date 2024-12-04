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
import { chatAPI } from '../../../services/api';

const ChatListScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getUnreadCount();
            setUnreadCount(response.unreadCount || 0); // .data 제거
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '알림을 불러오는데 실패했습니다.',
                [{ text: '확인' }]
            );
            setUnreadCount(0); // 에러 발생 시 기본값 설정
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 갱신

            return () => {
                clearInterval(interval);
                setUnreadCount(0);
            };
        }, [fetchUnreadCount])
    );

    const handleNewChat = async () => {
        if (loading) return;
        try {
            setLoading(true);
            const response = await chatAPI.createChatRoom({
                type: 'individual'
            });
            navigation.navigate('ChatRoom', {
                roomId: response.roomId
            });
        } catch (error) {
            Alert.alert('오류', error.message || '채팅방 생성에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);

            return () => {
                clearInterval(interval);
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
            disabled={disabled}
            hitSlop={20}
        >
            <Icon
                name="edit"
                size={24}
                color={disabled ? '#999' : '#333'}
            />
        </Pressable>
    );

    if (loading && !unreadCount) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 2
            }
        }),
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        right: 45,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    iconButtonPressed: {
        opacity: 0.7,
        backgroundColor: '#f0f0f0',
    },
    iconButtonDisabled: {
        opacity: 0.5,
    }
});

export default ChatListScreen;
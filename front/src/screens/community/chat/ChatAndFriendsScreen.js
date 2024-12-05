import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Pressable,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import SegmentedControl from '../../../components/SegmentedControl';
import ChatListContent from './ChatListContent';
import FriendsListContent from '../friend/FriendListContent';
import { chatAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const ChatAndFriendsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState('chats');
    const [slideAnimation] = useState(new Animated.Value(0));
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getUnreadCount();
            setUnreadCount(response.unreadCount || 0);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '알림을 불러오는데 실패했습니다.',
                [{ text: '확인' }]
            );
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
        }, [fetchUnreadCount])
    );

    const handleTabChange = useCallback((tab) => {
        setSelectedTab(tab);
        Animated.spring(slideAnimation, {
            toValue: tab === 'chats' ? 0 : 1,
            useNativeDriver: true,
            friction: 8,
            tension: 50
        }).start();
    }, [slideAnimation]);

    const handleNewChat = useCallback(async () => {
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
    }, [loading, navigation]);

    const handleAddFriend = useCallback(async () => {
        if (loading) return;
        try {
            setLoading(true);
            navigation.navigate('AddFriend');
        } catch (error) {
            Alert.alert('오류', error.message || '친구 추가 화면으로 이동할 수 없습니다');
        } finally {
            setLoading(false);
        }
    }, [loading, navigation]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUnreadCount();
        setRefreshing(false);
    }, [fetchUnreadCount]);

    if (loading && !selectedTab) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <SegmentedControl
                    selectedTab={selectedTab}
                    onTabChange={handleTabChange}
                    slideAnimation={slideAnimation}
                    unreadCount={unreadCount}
                />
                <ActionButton
                    selectedTab={selectedTab}
                    onNewChat={handleNewChat}
                    onAddFriend={handleAddFriend}
                    loading={loading}
                />
            </View>

            <Animated.View style={styles.contentContainer}>
                {selectedTab === 'chats' ? (
                    <ChatListContent
                        navigation={navigation}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                    />
                ) : (
                    <FriendsListContent
                        navigation={navigation}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                )}
            </Animated.View>
        </View>
    );
};

const ActionButton = React.memo(({ selectedTab, onNewChat, onAddFriend, loading }) => (
    <Pressable
        onPress={selectedTab === 'chats' ? onNewChat : onAddFriend}
        style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed
        ]}
        disabled={loading}
    >
        <Icon
            name={selectedTab === 'chats' ? "edit" : "user-plus"}
            size={24}
            color={theme.colors.text}
        />
    </Pressable>
));

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
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    contentContainer: {
        flex: 1,
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
    },
    iconButtonPressed: {
        opacity: 0.7,
        backgroundColor: theme.colors.pressed,
    }
});

export default React.memo(ChatAndFriendsScreen);
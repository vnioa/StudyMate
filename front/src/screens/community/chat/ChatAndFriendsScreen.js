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
import FriendsListContent from '../friend/FriendsListContent';
import { theme } from '../../../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../../../api/api';

const ChatAndFriendsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState('chats');
    const [slideAnimation] = useState(new Animated.Value(0));
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

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
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        return true;
    };

    const fetchUnreadCount = useCallback(async () => {
        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.get('/api/chat/unread-count');
            if (response.data.success) {
                setUnreadCount(response.data.unreadCount || 0);
                await AsyncStorage.setItem('lastUnreadCount',
                    JSON.stringify(response.data.unreadCount));
            }
        } catch (error) {
            const cachedCount = await AsyncStorage.getItem('lastUnreadCount');
            if (cachedCount) {
                setUnreadCount(JSON.parse(cachedCount));
            }

            Alert.alert(
                '오류',
                error.response?.data?.message || '알림을 불러오는데 실패했습니다.',
                [{ text: '확인' }]
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const handleNewChat = useCallback(async () => {
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
    }, [loading, navigation]);

    const handleTabChange = useCallback((tab) => {
        setSelectedTab(tab);
        Animated.spring(slideAnimation, {
            toValue: tab === 'chats' ? 0 : 1,
            useNativeDriver: true,
            friction: 8,
            tension: 50
        }).start();
    }, [slideAnimation]);

    const handleAddFriend = useCallback(async () => {
        if (loading || !(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.get('/api/friends/can-add');
            if (response.data.success) {
                navigation.navigate('AddFriend');
            }
        } catch (error) {
            Alert.alert('오류',
                error.response?.data?.message || '친구 추가 화면으로 이동할 수 없습니다');
        } finally {
            setLoading(false);
        }
    }, [loading, navigation]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUnreadCount();
        setRefreshing(false);
    }, [fetchUnreadCount]);

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
            return () => {
                setUnreadCount(0);
                setSelectedTab('chats');
            };
        }, [fetchUnreadCount])
    );

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
                    isOnline={isOnline}
                />
            </View>

            <Animated.View style={[
                styles.contentContainer,
                {
                    transform: [{
                        translateX: slideAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -width]
                        })
                    }]
                }
            ]}>
                {selectedTab === 'chats' ? (
                    <ChatListContent
                        navigation={navigation}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                        isOnline={isOnline}
                    />
                ) : (
                    <FriendsListContent
                        navigation={navigation}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        isOnline={isOnline}
                    />
                )}
            </Animated.View>
        </View>
    );
};

const ActionButton = React.memo(({
                                     selectedTab,
                                     onNewChat,
                                     onAddFriend,
                                     loading,
                                     isOnline
                                 }) => (
    <Pressable
        onPress={selectedTab === 'chats' ? onNewChat : onAddFriend}
        style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
            !isOnline && styles.iconButtonDisabled
        ]}
        disabled={loading || !isOnline}
    >
        <Icon
            name={selectedTab === 'chats' ? "edit" : "user-plus"}
            size={24}
            color={isOnline ? theme.colors.text : theme.colors.textDisabled}
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
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
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
        backgroundColor: theme.colors.background,
    },
    iconButton: {
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    iconButtonPressed: {
        opacity: 0.7,
        backgroundColor: theme.colors.pressed,
    },
    iconButtonDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    }
});

export default React.memo(ChatAndFriendsScreen);
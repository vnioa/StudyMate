import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Pressable,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import SegmentedControl from '../../components/SegmentedControl';
import ChatListContent from './ChatListContent';
import FriendsListContent from '../Friends/FriendsListContent';
import { chatAPI } from '../../services/api';

const ChatAndFriendsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState('chats');
    const [slideAnimation] = useState(new Animated.Value(0));
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchUnreadCount();
        });

        return unsubscribe;
    }, [navigation]);

    const fetchUnreadCount = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getUnreadCount();
            setUnreadCount(response.data.count);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '알림을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
        Animated.spring(slideAnimation, {
            toValue: tab === 'chats' ? 0 : 1,
            useNativeDriver: true,
            friction: 8,
            tension: 50
        }).start();
    };

    const handleNewChat = () => {
        if (loading) return;
        navigation.navigate('NewChat');
    };

    const handleAddFriend = () => {
        if (loading) return;
        navigation.navigate('AddFriend');
    };

    if (loading && !selectedTab) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
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
                {selectedTab === 'chats' ? (
                    <Pressable
                        onPress={handleNewChat}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconButtonPressed
                        ]}
                        disabled={loading}
                    >
                        <Icon name="edit" size={24} color="#333" />
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={handleAddFriend}
                        style={({ pressed }) => [
                            styles.iconButton,
                            pressed && styles.iconButtonPressed
                        ]}
                        disabled={loading}
                    >
                        <Icon name="user-plus" size={24} color="#333" />
                    </Pressable>
                )}
            </View>

            {selectedTab === 'chats' ? (
                <ChatListContent
                    navigation={navigation}
                    onRefresh={fetchUnreadCount}
                />
            ) : (
                <FriendsListContent
                    navigation={navigation}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    iconButton: {
        padding: 8,
        borderRadius: 8,
    },
    iconButtonPressed: {
        opacity: 0.7,
        backgroundColor: '#f0f0f0',
    }
});

export default ChatAndFriendsScreen;
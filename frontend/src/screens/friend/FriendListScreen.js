import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FriendsListContent from './FriendsListContent';

const FriendsListScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [unreadRequests, setUnreadRequests] = useState(0);

    useEffect(() => {
        fetchFriendRequests();
    }, []);

    const fetchFriendRequests = async () => {
        try {
            const response = await friendsApi.getFriendRequests();
            setUnreadRequests(response.data.length);
        } catch (error) {
            console.error('친구 요청 로딩 실패:', error);
        }
    };

    const handleAddFriend = () => {
        navigation.navigate('AddFriend');
    };

    const handleSettings = () => {
        navigation.navigate('FriendsSettings');
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>친구</Text>
                    {unreadRequests > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadRequests}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <Pressable
                        style={styles.headerButton}
                        onPress={handleAddFriend}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="user-plus" size={24} color="#333" />
                    </Pressable>
                    <Pressable
                        style={styles.headerButton}
                        onPress={handleSettings}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="settings" size={24} color="#333" />
                    </Pressable>
                </View>
            </View>
            <FriendsListContent navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    headerButton: {
        padding: 5,
    },
    badge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FriendsListScreen;
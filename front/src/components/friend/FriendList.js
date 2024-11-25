import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../shared/SearchBar';
import FriendItem from './FriendItem';
import {API_URL} from "../../config/apiUrl";

const FriendList = () => {
    const navigation = useNavigation();
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFriends, setFilteredFriends] = useState([]);

    useEffect(() => {
        fetchFriends();
    }, []);

    useEffect(() => {
        filterFriends();
    }, [searchQuery, friends]);

    const fetchFriends = async () => {
        try {
            const response = await fetch(`${API_URL}/friends`);
            const data = await response.json();
            setFriends(data);
        } catch (error) {
            console.error('친구 목록 조회 실패:', error);
        }
    };

    const filterFriends = () => {
        const filtered = friends.filter(friend =>
            friend.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredFriends(filtered);
    };

    const handleChatPress = (friendId) => {
        navigation.navigate('ChatRoom', {
            type: 'direct',
            participantId: friendId
        });
    };

    const handleProfilePress = (friendId) => {
        navigation.navigate('FriendProfile', { friendId });
    };

    const handleMorePress = (friend) => {
        Alert.alert(
            "친구 관리",
            `${friend.name}님에 대한 작업을 선택하세요`,
            [
                {
                    text: "채팅방 보관",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/chat/rooms/${friend.id}/archive`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                        } catch (error) {
                            console.error('채팅방 보관 실패:', error);
                        }
                    }
                },
                {
                    text: "차단",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/friends/block`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    blockedUserId: friend.id
                                })
                            });
                            // 친구 목록 새로고침
                            fetchFriends();
                        } catch (error) {
                            console.error('친구 차단 실패:', error);
                        }
                    },
                    style: 'destructive'
                },
                {
                    text: "친구 삭제",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/friends/${friend.id}`, {
                                method: 'DELETE'
                            });
                            // 친구 목록 새로고침
                            fetchFriends();
                        } catch (error) {
                            console.error('친구 삭제 실패:', error);
                        }
                    },
                    style: 'destructive'
                },
                {
                    text: "취소",
                    style: 'cancel'
                }
            ]
        );
    };

    const renderFriend = ({ item }) => (
        <FriendItem
            friend={item}
            onChatPress={() => handleChatPress(item.id)}
            onProfilePress={() => handleProfilePress(item.id)}
            onMorePress={() => handleMorePress(item)}
        />
    );

    return (
        <View style={styles.container}>
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="친구 검색"
            />
            <FlatList
                data={filteredFriends}
                renderItem={renderFriend}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContainer}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddFriend')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    addButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4
    }
});

export default FriendList;
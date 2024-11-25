import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/shared/Header';
import SearchBar from '../components/shared/SearchBar';
import FriendList from '../components/friend/FriendList';

const FriendListScreen = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState([]);
    const [filteredFriends, setFilteredFriends] = useState([]);

    useEffect(() => {
        fetchFriends();
    }, []);

    useEffect(() => {
        filterFriends();
    }, [searchQuery, friends]);

    const fetchFriends = async () => {
        try {
            const response = await fetch('API_URL/friends');
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

    const handleAddFriend = () => {
        navigation.navigate('AddFriend');
    };

    const handleFriendProfile = (friendId) => {
        navigation.navigate('FriendProfile', { friendId });
    };

    return (
        <View style={styles.container}>
            <Header
                title="친구"
                rightButton={{
                    icon: "person-add",
                    onPress: handleAddFriend
                }}
            />
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="친구 검색"
            />
            <FriendList
                friends={filteredFriends}
                onFriendPress={handleFriendProfile}
                onRefresh={fetchFriends}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    }
});

export default FriendListScreen;
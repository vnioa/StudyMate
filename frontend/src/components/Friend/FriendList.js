// src/components/Friend/FriendList.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { fetchFriends, deleteFriend } from '../../api/friendAPI';

const FriendList = ({ token, onFriendSelect }) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    // 친구 목록 불러오기
    const loadFriends = async () => {
        try {
            setLoading(true);
            const data = await fetchFriends(token);
            setFriends(data);
        } catch (error) {
            console.error("Error fetching friends:", error);
            Alert.alert("Error", "Failed to load friends.");
        } finally {
            setLoading(false);
        }
    };

    // 친구 삭제 기능
    const handleDeleteFriend = async (friendId) => {
        Alert.alert(
            "Delete Friend",
            "Are you sure you want to delete this friend?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteFriend(friendId, token);
                            setFriends(friends.filter((friend) => friend.id !== friendId));
                            Alert.alert("Friend Deleted", "The friend has been successfully deleted.");
                        } catch (error) {
                            console.error("Error deleting friend:", error);
                            Alert.alert("Error", "Failed to delete the friend.");
                        }
                    },
                },
            ]
        );
    };

    useEffect(() => {
        loadFriends();
    }, []);

    const renderFriend = ({ item }) => (
        <View style={styles.friendContainer}>
            <TouchableOpacity onPress={() => onFriendSelect(item)} style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteFriend(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text>Loading friends...</Text>
            ) : friends.length > 0 ? (
                <FlatList
                    data={friends}
                    renderItem={renderFriend}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noFriendsText}>No friends found.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
    },
    friendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        color: '#333',
    },
    deleteButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    noFriendsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
});

export default FriendList;

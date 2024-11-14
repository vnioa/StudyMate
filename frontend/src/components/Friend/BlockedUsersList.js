// src/components/Friend/BlockedUsersList.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { unblockFriend, fetchBlockedFriends } from '../../api/friendAPI';

const BlockedUsersList = ({ token }) => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // 차단된 사용자 목록 불러오기
    const loadBlockedUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchBlockedFriends(token);
            setBlockedUsers(data);
        } catch (error) {
            console.error("Error fetching blocked users:", error);
            Alert.alert("Error", "Failed to load blocked users.");
        } finally {
            setLoading(false);
        }
    };

    // 차단 해제 기능
    const handleUnblock = async (userId) => {
        try {
            await unblockFriend(userId, token);
            setBlockedUsers(blockedUsers.filter((user) => user.id !== userId));
            Alert.alert("Unblocked", "The user has been unblocked.");
        } catch (error) {
            console.error("Error unblocking user:", error);
            Alert.alert("Error", "Failed to unblock the user.");
        }
    };

    useEffect(() => {
        loadBlockedUsers();
    }, []);

    const renderBlockedUser = ({ item }) => (
        <View style={styles.userContainer}>
            <Text style={styles.userName}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleUnblock(item.id)} style={styles.unblockButton}>
                <Text style={styles.unblockButtonText}>Unblock</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text>Loading blocked users...</Text>
            ) : blockedUsers.length > 0 ? (
                <FlatList
                    data={blockedUsers}
                    renderItem={renderBlockedUser}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noBlockedUsersText}>No blocked users.</Text>
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
    userContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    userName: {
        fontSize: 16,
        color: '#333',
    },
    unblockButton: {
        backgroundColor: '#007bff',
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    unblockButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    noBlockedUsersText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
});

export default BlockedUsersList;

// src/components/Friend/FriendRequest.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { fetchFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../../api/friendAPI';

const FriendRequest = ({ token, onRequestProcessed }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // 친구 요청 목록 불러오기
    const loadFriendRequests = async () => {
        try {
            setLoading(true);
            const data = await fetchFriendRequests(token);
            setRequests(data);
        } catch (error) {
            console.error("Error fetching friend requests:", error);
            Alert.alert("Error", "Failed to load friend requests.");
        } finally {
            setLoading(false);
        }
    };

    // 친구 요청 수락
    const handleAcceptRequest = async (requestId) => {
        try {
            await acceptFriendRequest(requestId, token);
            setRequests(requests.filter((request) => request.id !== requestId));
            Alert.alert("Request Accepted", "You are now friends!");
            onRequestProcessed();
        } catch (error) {
            console.error("Error accepting friend request:", error);
            Alert.alert("Error", "Failed to accept the friend request.");
        }
    };

    // 친구 요청 거절
    const handleRejectRequest = async (requestId) => {
        try {
            await rejectFriendRequest(requestId, token);
            setRequests(requests.filter((request) => request.id !== requestId));
            Alert.alert("Request Rejected", "The friend request has been rejected.");
            onRequestProcessed();
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            Alert.alert("Error", "Failed to reject the friend request.");
        }
    };

    useEffect(() => {
        loadFriendRequests();
    }, []);

    const renderRequest = ({ item }) => (
        <View style={styles.requestContainer}>
            <Text style={styles.requestName}>{item.name}</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => handleAcceptRequest(item.id)} style={styles.acceptButton}>
                    <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRejectRequest(item.id)} style={styles.rejectButton}>
                    <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text>Loading friend requests...</Text>
            ) : requests.length > 0 ? (
                <FlatList
                    data={requests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noRequestsText}>No friend requests.</Text>
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
    requestContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    requestName: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
    },
    acceptButton: {
        backgroundColor: '#28a745',
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginRight: 5,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    rejectButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    rejectButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    noRequestsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
});

export default FriendRequest;

// src/components/Friend/FriendProfile.js

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { deleteFriend } from '../../api/friendAPI';

const FriendProfile = ({ friend, token, onDelete, onMessage }) => {
    const handleDeleteFriend = () => {
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
                            await deleteFriend(friend.id, token);
                            onDelete(friend.id);
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

    return (
        <View style={styles.container}>
            <Image source={{ uri: friend.profileImageUrl }} style={styles.profileImage} />
            <Text style={styles.name}>{friend.name}</Text>
            {friend.status && <Text style={styles.status}>{friend.status}</Text>}

            <View style={styles.actions}>
                <TouchableOpacity onPress={onMessage} style={styles.messageButton}>
                    <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteFriend} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Delete Friend</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        backgroundColor: '#ddd',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    status: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        marginBottom: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    messageButton: {
        flex: 1,
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 5,
    },
    messageButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#ff4d4d',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginLeft: 5,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default FriendProfile;

// src/components/Friend/FriendSearch.js

import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { searchFriends, sendFriendRequest } from '../../api/friendAPI';

const FriendSearch = ({ token }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // 친구 검색
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            Alert.alert("Error", "Please enter a search query.");
            return;
        }
        try {
            setLoading(true);
            const data = await searchFriends(searchQuery, token);
            setSearchResults(data);
        } catch (error) {
            console.error("Error searching friends:", error);
            Alert.alert("Error", "Failed to search for friends.");
        } finally {
            setLoading(false);
        }
    };

    // 친구 요청 보내기
    const handleSendRequest = async (userId) => {
        try {
            await sendFriendRequest(userId, token);
            Alert.alert("Friend Request Sent", "Your friend request has been sent.");
        } catch (error) {
            console.error("Error sending friend request:", error);
            Alert.alert("Error", "Failed to send friend request.");
        }
    };

    const renderSearchResult = ({ item }) => (
        <View style={styles.resultContainer}>
            <Text style={styles.userName}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleSendRequest(item.id)} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search for friends..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
            {loading ? (
                <Text>Searching...</Text>
            ) : searchResults.length > 0 ? (
                <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noResultsText}>No results found.</Text>
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
    searchInput: {
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        fontSize: 16,
    },
    searchButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    resultContainer: {
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
    addButton: {
        backgroundColor: '#28a745',
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    noResultsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
});

export default FriendSearch;

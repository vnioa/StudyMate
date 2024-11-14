// src/components/Chat/ChatList.js

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { fetchChatRooms } from '../../api/chatAPI';

const ChatList = ({ navigation, token }) => {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // 채팅 목록 불러오기
    const loadChatRooms = async () => {
        try {
            setLoading(true);
            const data = await fetchChatRooms(token);
            setChatRooms(data);
        } catch (error) {
            console.error("Error loading chat rooms:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChatRooms();
    }, []);

    // 개별 채팅방 이동
    const openChatRoom = (roomId) => {
        navigation.navigate('ChatRoomScreen', { roomId });
    };

    const renderChatRoom = ({ item }) => (
        <TouchableOpacity style={styles.chatRoom} onPress={() => openChatRoom(item.id)}>
            <Text style={styles.chatRoomName}>{item.name}</Text>
            <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <FlatList
                    data={chatRooms}
                    renderItem={renderChatRoom}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    chatRoom: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    chatRoomName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
        alignSelf: 'flex-end',
    },
});

export default ChatList;

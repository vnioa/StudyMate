import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../shared/SearchBar';
import { ChatRoomItem } from './ChatRoomItem';
import {API_URL} from "../../config/apiUrl";

const ChatList = () => {
    const navigation = useNavigation();
    const [chatRooms, setChatRooms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRooms, setFilteredRooms] = useState([]);

    useEffect(() => {
        fetchChatRooms();
    }, []);

    useEffect(() => {
        filterChatRooms();
    }, [searchQuery, chatRooms]);

    const fetchChatRooms = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/rooms`);
            const data = await response.json();
            setChatRooms(data);
        } catch (error) {
            console.error('채팅방 목록 조회 실패:', error);
        }
    };

    const filterChatRooms = () => {
        const filtered = chatRooms.filter(room =>
            room.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredRooms(filtered);
    };

    const handlePinRoom = async (roomId) => {
        try {
            await fetch(`${API_URL}/chat/rooms/${roomId}/pin`, {
                method: 'PUT'
            });
            fetchChatRooms();
        } catch (error) {
            console.error('채팅방 고정 실패:', error);
        }
    };

    const handleArchiveRoom = async (roomId) => {
        try {
            await fetch(`${API_URL}/chat/rooms/${roomId}/archive`, {
                method: 'PUT'
            });
            fetchChatRooms();
        } catch (error) {
            console.error('채팅방 보관 실패:', error);
        }
    };

    const renderChatRoom = ({ item }) => (
        <ChatRoomItem
            room={item}
            onPress={() => navigation.navigate('ChatRoom', { roomId: item.id })}
            onPin={() => handlePinRoom(item.id)}
            onArchive={() => handleArchiveRoom(item.id)}
        />
    );

    return (
        <View style={styles.container}>
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="채팅방 검색"
            />
            <FlatList
                data={filteredRooms}
                renderItem={renderChatRoom}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContainer}
            />
            <TouchableOpacity
                style={styles.newChatButton}
                onPress={() => navigation.navigate('NewChat')}
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
    newChatButton: {
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

export default ChatList;
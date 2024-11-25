import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchBar } from '../../components/shared/SearchBar';
import ChatRoomItem from '../../components/chat/ChatRoomItem';
import CustomButton from '../../components/shared/CustomButton';
import Header from '../../components/shared/Header';
import socket from '../../services/socket';
import {API_URL} from "../../config/apiUrl";

const ChatListScreen = () => {
    const navigation = useNavigation();
    const [chatRooms, setChatRooms] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRooms, setFilteredRooms] = useState([]);

    useEffect(() => {
        fetchChatRooms();
        setupSocketListeners();
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

    const setupSocketListeners = () => {
        socket.on('roomsList', (rooms) => {
            setChatRooms(rooms);
        });

        socket.on('newMessage', (data) => {
            updateRoomLastMessage(data);
        });

        return () => {
            socket.off('roomsList');
            socket.off('newMessage');
        };
    };

    const filterChatRooms = () => {
        const filtered = chatRooms.filter(room =>
            room.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredRooms(filtered);
    };

    const updateRoomLastMessage = (messageData) => {
        setChatRooms(prevRooms =>
            prevRooms.map(room => {
                if (room.id === messageData.roomId) {
                    return {
                        ...room,
                        lastMessage: messageData.message,
                        updatedAt: new Date()
                    };
                }
                return room;
            })
        );
    };

    const handleRoomPress = (room) => {
        navigation.navigate('ChatRoom', { roomId: room.id, name: room.name });
    };

    const renderChatRoom = ({ item }) => (
        <ChatRoomItem
            room={item}
            onPress={() => handleRoomPress(item)}
        />
    );

    return (
        <View style={styles.container}>
            <Header
                title="채팅"
                rightButton={{
                    icon: "add",
                    onPress: () => navigation.navigate('CreateChat')
                }}
            />
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
    }
});

export default ChatListScreen;
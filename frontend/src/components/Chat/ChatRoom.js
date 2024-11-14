// src/components/Chat/ChatRoom.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { fetchChatRoomById, sendMessage, sendFile } from '../../api/chatAPI';

const ChatRoom = ({ route, token }) => {
    const { roomId } = route.params; // 전달받은 채팅방 ID
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // 채팅방 메시지 로드
    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await fetchChatRoomById(roomId, token);
            setMessages(data.messages);
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setLoading(false);
        }
    };

    // 메시지 전송
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            const sentMessage = await sendMessage(roomId, newMessage, token);
            setMessages((prevMessages) => [sentMessage, ...prevMessages]);
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // 파일 첨부 기능 (예: 이미지 전송)
    const handleSendFile = async (file) => {
        try {
            const sentFileMessage = await sendFile(roomId, file, token);
            setMessages((prevMessages) => [sentFileMessage, ...prevMessages]);
        } catch (error) {
            console.error("Error sending file:", error);
        }
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const renderMessage = ({ item }) => (
        <View style={styles.messageContainer}>
            <Text style={styles.messageSender}>{item.sender}</Text>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <Text>Loading messages...</Text>
            ) : (
                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    inverted // 최신 메시지가 아래가 아닌 위에 표시되도록 설정
                />
            )}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f5f5f5',
    },
    messageContainer: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#e6e6e6',
        borderRadius: 5,
    },
    messageSender: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    messageText: {
        fontSize: 16,
        color: '#000',
    },
    messageTimestamp: {
        fontSize: 10,
        color: '#666',
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        padding: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        justifyContent: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ChatRoom;
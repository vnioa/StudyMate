// screens/ChatRoomScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { fetchMessages, sendMessage, fetchScheduledMessages, scheduleMessage } from '../../api/chat';
import MessageScheduler from '../../components/chat/MessageScheduler';
import FileUpload from '../../components/chat/FileUpload';
import OnlineStatus from '../../components/chat/OnlineStatus';
import MessageTag from '../../components/chat/MessageTag';
import ReplyMessage from '../../components/chat/ReplyMessage';
import ChatRoomScreenStyles from './ChatRoomScreenStyles';

const ChatRoomScreen = ({ route }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const chatId = route.params.chatId;

    // Load messages on screen focus
    useEffect(() => {
        if (isFocused) {
            loadMessages().catch((error) => console.error('Error loading messages:', error));
            loadScheduledMessages().catch((error) => console.error('Error loading scheduled messages:', error));
        }
    }, [isFocused]);

    // Fetch messages
    const loadMessages = async () => {
        setLoading(true);
        try {
            const fetchedMessages = await fetchMessages(chatId);
            setMessages(fetchedMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            Alert.alert('Error', 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    // Fetch scheduled messages
    const loadScheduledMessages = async () => {
        try {
            const fetchedScheduledMessages = await fetchScheduledMessages(chatId);
            setScheduledMessages(fetchedScheduledMessages);
        } catch (error) {
            console.error('Failed to fetch scheduled messages:', error);
        }
    };

    // Send message
    const handleSend = async () => {
        if (newMessage.trim()) {
            try {
                const message = {
                    text: newMessage,
                    replyTo: replyTo ? replyTo.id : null,
                    tags: [],
                    timestamp: new Date().toISOString()
                };
                const sentMessage = await sendMessage(chatId, message);
                setMessages((prevMessages) => [sentMessage, ...prevMessages]);
                setNewMessage('');
                setReplyTo(null);
            } catch (error) {
                console.error('Failed to send message:', error);
                Alert.alert('Error', 'Failed to send message');
            }
        }
    };

    // Schedule message
    const handleScheduleMessage = async (scheduledMessage) => {
        try {
            await scheduleMessage(chatId, scheduledMessage);
            setScheduledMessages((prev) => [scheduledMessage, ...prev]);
            Alert.alert('Message scheduled successfully');
        } catch (error) {
            console.error('Failed to schedule message:', error);
        }
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        Alert.alert('File selected', `Name: ${file.name}, Size: ${file.size}`);
        // Implement file upload logic here
    };

    // Reply to message
    const handleReply = (message) => {
        setReplyTo(message);
    };

    // Render message component
    const renderMessage = ({ item }) => (
        <View style={ChatRoomScreenStyles.messageContainer}>
            <Text style={ChatRoomScreenStyles.messageText}>{item.text}</Text>
            {item.replyTo && <ReplyMessage messageId={item.replyTo} />}
            <MessageTag tags={item.tags} />
            <Text style={ChatRoomScreenStyles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
            <Button title="Reply" onPress={() => handleReply(item)} />
        </View>
    );

    // Render scheduled message component
    const renderScheduledMessage = ({ item }) => (
        <View style={ChatRoomScreenStyles.scheduledMessageContainer}>
            <Text style={ChatRoomScreenStyles.scheduledMessageText}>Scheduled: {item.message}</Text>
            <Text style={ChatRoomScreenStyles.timestamp}>{new Date(item.date).toLocaleString()}</Text>
        </View>
    );

    // Refresh messages on pull
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        await loadMessages();
        setLoading(false);
    }, []);

    return (
        <View style={ChatRoomScreenStyles.container}>
            <Text style={ChatRoomScreenStyles.header}>Real-time Chat</Text>
            <OnlineStatus userId={route.params.userId} style={ChatRoomScreenStyles.onlineStatus} />

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" style={ChatRoomScreenStyles.loadingIndicator} />
            ) : (
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderMessage}
                    inverted
                    style={ChatRoomScreenStyles.flatListContainer}
                    refreshing={loading}
                    onRefresh={handleRefresh}
                />
            )}

            <FlatList
                data={scheduledMessages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderScheduledMessage}
                style={ChatRoomScreenStyles.scheduledListContainer}
            />

            <TextInput
                placeholder="Type your message..."
                value={newMessage}
                onChangeText={setNewMessage}
                style={ChatRoomScreenStyles.textInput}
            />
            <Button title="Send" onPress={handleSend} style={ChatRoomScreenStyles.sendButton} />
            <MessageScheduler onScheduleMessage={handleScheduleMessage} />
            <FileUpload onUpload={handleFileUpload} />

            {replyTo && (
                <View style={ChatRoomScreenStyles.replyContainer}>
                    <Text style={ChatRoomScreenStyles.replyText}>Replying to: {replyTo.text}</Text>
                    <Button title="Cancel Reply" onPress={() => setReplyTo(null)} style={ChatRoomScreenStyles.cancelReplyButton} />
                </View>
            )}
        </View>
    );
};

export default ChatRoomScreen;

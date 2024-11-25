import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';
import ChatHeader from '../shared/Header';
import {API_URL} from "../../config/apiUrl";

const ChatRoom = () => {
    const route = useRoute();
    const { roomId } = route.params;
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        setupSocketConnection();
    }, [roomId]);

    const fetchMessages = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('메시지 조회 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setupSocketConnection = () => {
        const socket = io('API_URL', {
            auth: {
                token: localStorage.getItem('token')
            }
        });

        // 연결 성공 시
        socket.on('connect', () => {
            console.log('Socket connected');
            // 채팅방 참여
            socket.emit('join_room', roomId);
        });

        // 새 메시지 수신
        socket.on('receive_message', (message) => {
            setMessages(prevMessages => [...prevMessages, message]);
            scrollToBottom();
        });

        // 타이핑 상태 수신
        socket.on('user_typing', (userId) => {
            // 타이핑 상태 표시 로직
        });

        // 읽음 상태 수신
        socket.on('message_read', ({ userId, messageId }) => {
            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, readBy: [...msg.readBy, userId] }
                        : msg
                )
            );
        });

        // 참여자 목록 업데이트 수신
        socket.on('participants_updated', (participants) => {
            // 참여자 목록 업데이트 로직
        });

        // 연결 해제 시
        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        // 컴포넌트 언마운트 시 소켓 연결 정리
        return () => {
            socket.emit('leave_room', roomId);
            socket.disconnect();
        };
    };

    const handleSendMessage = async (content, type = 'text') => {
        try {
            const response = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, type }),
            });

            if (response.ok) {
                fetchMessages();
                scrollToBottom();
            }
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/chat/rooms/${roomId}/files`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                fetchMessages();
                scrollToBottom();
            }
        } catch (error) {
            console.error('파일 업로드 실패:', error);
        }
    };

    const scrollToBottom = () => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    };

    const renderMessage = ({ item }) => (
        <MessageItem
            message={item}
            onReply={() => handleReplyMessage(item)}
            onForward={() => handleForwardMessage(item)}
            onDelete={() => handleDeleteMessage(item.id)}
        />
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ChatHeader roomId={roomId} />
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id.toString()}
                onContentSizeChange={scrollToBottom}
                contentContainerStyle={styles.messageList}
            />
            <MessageInput
                onSendMessage={handleSendMessage}
                onFileUpload={handleFileUpload}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    messageList: {
        paddingHorizontal: 16,
        paddingVertical: 8
    }
});

export default ChatRoom;
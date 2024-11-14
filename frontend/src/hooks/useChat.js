// src/hooks/useChat.js

import { useContext, useCallback } from 'react';
import { ChatContext } from '../contexts/ChatContext';

const useChat = () => {
    const {
        chatRooms,
        currentChatRoom,
        messages,
        loading,
        error,
        loadChatRooms,
        loadMessages,
        addMessage,
    } = useContext(ChatContext);

    // 특정 채팅방으로 전환
    const switchChatRoom = useCallback(
        async (chatRoomId) => {
            if (chatRoomId !== currentChatRoom) {
                await loadMessages(chatRoomId);
            }
        },
        [currentChatRoom, loadMessages]
    );

    // 새 메시지 전송
    const sendMessage = useCallback(
        (messageContent) => {
            if (currentChatRoom) {
                const newMessage = {
                    id: Date.now(),
                    content: messageContent,
                    sender: 'You',
                    timestamp: new Date().toISOString(),
                };
                addMessage(newMessage);
            }
        },
        [currentChatRoom, addMessage]
    );

    return {
        chatRooms,
        currentChatRoom,
        messages,
        loading,
        error,
        loadChatRooms,
        switchChatRoom,
        sendMessage,
    };
};

export default useChat;

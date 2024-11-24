import React from 'react';
import ChatList from '../../components/chat/ChatList';

const ChatScreen = () => {
    // Mock chat data for now
    const chats = [
        { id: '1', name: 'John Doe', lastMessage: 'Hey there!' },
        { id: '2', name: 'Jane Smith', lastMessage: 'See you soon.' },
    ];

    return <ChatList chats={chats} />;
};

export default ChatScreen;
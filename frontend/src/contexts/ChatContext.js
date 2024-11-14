// src/contexts/ChatContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fetchChatRooms, fetchMessages } from '../api/chatAPI';

const ChatContext = createContext();

const initialState = {
    chatRooms: [],
    currentChatRoom: null,
    messages: [],
    loading: false,
    error: null,
};

const chatReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CHAT_ROOMS':
            return { ...state, chatRooms: action.payload };
        case 'SET_CURRENT_CHAT_ROOM':
            return { ...state, currentChatRoom: action.payload, messages: [] };
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

export const ChatProvider = ({ children }) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);

    // 채팅방 목록 불러오기
    const loadChatRooms = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const chatRooms = await fetchChatRooms();
            dispatch({ type: 'SET_CHAT_ROOMS', payload: chatRooms });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load chat rooms' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 특정 채팅방의 메시지 불러오기
    const loadMessages = async (chatRoomId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const messages = await fetchMessages(chatRoomId);
            dispatch({ type: 'SET_MESSAGES', payload: messages });
            dispatch({ type: 'SET_CURRENT_CHAT_ROOM', payload: chatRoomId });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 새 메시지 추가
    const addMessage = (message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
    };

    useEffect(() => {
        loadChatRooms();
    }, []);

    return (
        <ChatContext.Provider
            value={{
                chatRooms: state.chatRooms,
                currentChatRoom: state.currentChatRoom,
                messages: state.messages,
                loading: state.loading,
                error: state.error,
                loadChatRooms,
                loadMessages,
                addMessage,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);

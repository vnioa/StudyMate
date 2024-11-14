// src/contexts/FriendContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fetchFriends, fetchFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../api/friendAPI';

const FriendContext = createContext();

const initialState = {
    friends: [],
    friendRequests: [],
    loading: false,
    error: null,
};

const friendReducer = (state, action) => {
    switch (action.type) {
        case 'SET_FRIENDS':
            return { ...state, friends: action.payload };
        case 'SET_FRIEND_REQUESTS':
            return { ...state, friendRequests: action.payload };
        case 'ADD_FRIEND':
            return { ...state, friends: [...state.friends, action.payload] };
        case 'REMOVE_FRIEND_REQUEST':
            return {
                ...state,
                friendRequests: state.friendRequests.filter((req) => req.id !== action.payload)
            };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

export const FriendProvider = ({ children }) => {
    const [state, dispatch] = useReducer(friendReducer, initialState);

    // 친구 목록 불러오기
    const loadFriends = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const friends = await fetchFriends();
            dispatch({ type: 'SET_FRIENDS', payload: friends });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load friends' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 친구 요청 목록 불러오기
    const loadFriendRequests = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const requests = await fetchFriendRequests();
            dispatch({ type: 'SET_FRIEND_REQUESTS', payload: requests });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load friend requests' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 친구 요청 수락
    const handleAcceptRequest = async (requestId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await acceptFriendRequest(requestId);
            dispatch({ type: 'ADD_FRIEND', payload: state.friendRequests.find((req) => req.id === requestId) });
            dispatch({ type: 'REMOVE_FRIEND_REQUEST', payload: requestId });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to accept friend request' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // 친구 요청 거절
    const handleRejectRequest = async (requestId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            await rejectFriendRequest(requestId);
            dispatch({ type: 'REMOVE_FRIEND_REQUEST', payload: requestId });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: 'Failed to reject friend request' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        loadFriends();
        loadFriendRequests();
    }, []);

    return (
        <FriendContext.Provider
            value={{
                friends: state.friends,
                friendRequests: state.friendRequests,
                loading: state.loading,
                error: state.error,
                loadFriends,
                loadFriendRequests,
                handleAcceptRequest,
                handleRejectRequest,
            }}
        >
            {children}
        </FriendContext.Provider>
    );
};

export const useFriend = () => useContext(FriendContext);

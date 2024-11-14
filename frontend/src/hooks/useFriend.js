// src/hooks/useFriend.js

import { useContext, useCallback } from 'react';
import { FriendContext } from '../contexts/FriendContext';

const useFriend = () => {
    const {
        friends,
        friendRequests,
        loading,
        error,
        loadFriends,
        loadFriendRequests,
        handleAcceptRequest,
        handleRejectRequest,
    } = useContext(FriendContext);

    // 친구 목록 새로 고침
    const refreshFriends = useCallback(() => {
        loadFriends();
    }, [loadFriends]);

    // 친구 요청 목록 새로 고침
    const refreshFriendRequests = useCallback(() => {
        loadFriendRequests();
    }, [loadFriendRequests]);

    // 친구 요청 수락
    const acceptFriendRequest = useCallback(
        (requestId) => {
            handleAcceptRequest(requestId);
        },
        [handleAcceptRequest]
    );

    // 친구 요청 거절
    const rejectFriendRequest = useCallback(
        (requestId) => {
            handleRejectRequest(requestId);
        },
        [handleRejectRequest]
    );

    return {
        friends,
        friendRequests,
        loading,
        error,
        refreshFriends,
        refreshFriendRequests,
        acceptFriendRequest,
        rejectFriendRequest,
    };
};

export default useFriend;

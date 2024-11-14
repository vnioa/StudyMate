// src/api/friendAPI.js

import axios from 'axios';
import {API_URL} from "../config/apiurl";

// 공통 헤더 설정 함수 (인증 토큰 포함)
const getHeaders = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// 친구 목록 가져오기
export const fetchFriends = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/list`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error fetching friends list:", error);
        throw new Error("친구 목록을 불러오는 중 오류가 발생했습니다.");
    }
};

// 친구 요청 보내기
export const sendFriendRequest = async (friendId, token) => {
    try {
        const response = await axios.post(`${API_URL}/request`, { friendId }, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error sending friend request:", error);
        throw new Error("친구 요청을 보내는 중 오류가 발생했습니다.");
    }
};

// 받은 친구 요청 목록 가져오기
export const fetchFriendRequests = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/requests`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        throw new Error("받은 친구 요청 목록을 불러오는 중 오류가 발생했습니다.");
    }
};

// 친구 요청 수락
export const acceptFriendRequest = async (requestId, token) => {
    try {
        const response = await axios.post(`${API_URL}/requests/${requestId}/accept`, {}, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error accepting friend request with ID ${requestId}:`, error);
        throw new Error("친구 요청을 수락하는 중 오류가 발생했습니다.");
    }
};

// 친구 요청 거절
export const rejectFriendRequest = async (requestId, token) => {
    try {
        const response = await axios.post(`${API_URL}/requests/${requestId}/reject`, {}, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error rejecting friend request with ID ${requestId}:`, error);
        throw new Error("친구 요청을 거절하는 중 오류가 발생했습니다.");
    }
};

// 친구 삭제
export const deleteFriend = async (friendId, token) => {
    try {
        const response = await axios.delete(`${API_URL}/list/${friendId}`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error deleting friend with ID ${friendId}:`, error);
        throw new Error("친구를 삭제하는 중 오류가 발생했습니다.");
    }
};

// 친구 검색
export const searchFriends = async (keyword, token) => {
    try {
        const response = await axios.get(`${API_URL}/search`, {
            params: { keyword },
            ...getHeaders(token),
        });
        return response.data;
    } catch (error) {
        console.error("Error searching for friends:", error);
        throw new Error("친구 검색 중 오류가 발생했습니다.");
    }
};

// 차단된 친구 목록 가져오기
export const fetchBlockedFriends = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/blocked`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error fetching blocked friends list:", error);
        throw new Error("차단된 친구 목록을 불러오는 중 오류가 발생했습니다.");
    }
};

// 친구 차단
export const blockFriend = async (friendId, token) => {
    try {
        const response = await axios.post(`${API_URL}/block`, { friendId }, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error blocking friend with ID ${friendId}:`, error);
        throw new Error("친구를 차단하는 중 오류가 발생했습니다.");
    }
};

// 차단 해제
export const unblockFriend = async (friendId, token) => {
    try {
        const response = await axios.post(`${API_URL}/unblock`, { friendId }, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error unblocking friend with ID ${friendId}:`, error);
        throw new Error("친구 차단을 해제하는 중 오류가 발생했습니다.");
    }
};

// 친구 요청 자동 승인 설정
export const setAutoAcceptRequests = async (isEnabled, token) => {
    try {
        const response = await axios.put(`${API_URL}/settings/auto-accept`,
            { autoAccept: isEnabled }, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error setting auto-accept for friend requests:", error);
        throw new Error("친구 요청 자동 승인 설정 중 오류가 발생했습니다.");
    }
};

// 친구 추천 목록 가져오기 (위치 기반)
export const fetchFriendRecommendations = async (location, token) => {
    try {
        const response = await axios.get(`${API_URL}/recommendations`, {
            params: { location },
            ...getHeaders(token),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching friend recommendations:", error);
        throw new Error("친구 추천 목록을 불러오는 중 오류가 발생했습니다.");
    }
};

// 친구 추가 QR 코드 생성
export const generateFriendQRCode = async (userId, token) => {
    try {
        const response = await axios.get(`${API_URL}/qr-code`, {
            params: { userId },
            ...getHeaders(token),
        });
        return response.data;
    } catch (error) {
        console.error("Error generating QR code for friend addition:", error);
        throw new Error("QR 코드를 생성하는 중 오류가 발생했습니다.");
    }
};

// QR 코드로 친구 추가
export const addFriendByQRCode = async (qrCode, token) => {
    try {
        const response = await axios.post(`${API_URL}/qr-code/add`, { qrCode }, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error adding friend by QR code:", error);
        throw new Error("QR 코드로 친구 추가 중 오류가 발생했습니다.");
    }
};

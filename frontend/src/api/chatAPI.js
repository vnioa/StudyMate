// src/api/chatAPI.js

import axios from 'axios';
import {API_URL} from '../config/apiurl'

// 공통 헤더 설정 함수 (인증 토큰 포함)
const getHeaders = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// 채팅방 목록 가져오기
export const fetchChatRooms = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/rooms`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        throw new Error("채팅방 목록을 불러오는 중 오류가 발생했습니다.");
    }
};

// 특정 채팅방 정보 가져오기
export const fetchChatRoomById = async (roomId, token) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error fetching chat room with ID ${roomId}:`, error);
        throw new Error("채팅방 정보를 불러오는 중 오류가 발생했습니다.");
    }
};

// 채팅방 생성
export const createChatRoom = async (roomData, token) => {
    try {
        const response = await axios.post(`${API_URL}/rooms`, roomData, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error creating chat room:", error);
        throw new Error("채팅방을 생성하는 중 오류가 발생했습니다.");
    }
};

// 채팅방 삭제
export const deleteChatRoom = async (roomId, token) => {
    try {
        const response = await axios.delete(`${API_URL}/rooms/${roomId}`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error deleting chat room with ID ${roomId}:`, error);
        throw new Error("채팅방을 삭제하는 중 오류가 발생했습니다.");
    }
};

// 메시지 전송
export const sendMessage = async (roomId, message, token) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/messages`,
            { message }, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error sending message to room ID ${roomId}:`, error);
        throw new Error("메시지 전송 중 오류가 발생했습니다.");
    }
};

// 파일 첨부 (이미지, 동영상 등)
export const sendFile = async (roomId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/files`, formData, {
            ...getHeaders(token),
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error sending file to room ID ${roomId}:`, error);
        throw new Error("파일 전송 중 오류가 발생했습니다.");
    }
};

// 메시지 읽음 상태 업데이트
export const updateReadStatus = async (roomId, messageId, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/rooms/${roomId}/messages/${messageId}/read`,
            {}, getHeaders(token)
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating read status for message ID ${messageId} in room ID ${roomId}:`, error);
        throw new Error("메시지 읽음 상태 업데이트 중 오류가 발생했습니다.");
    }
};

// 메시지 예약 전송
export const scheduleMessage = async (roomId, message, scheduledTime, token) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/messages/schedule`,
            { message, scheduledTime }, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error scheduling message:", error);
        throw new Error("메시지 예약 전송 중 오류가 발생했습니다.");
    }
};

// 채팅방의 메시지 검색
export const searchMessages = async (roomId, keyword, token) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}/messages/search`, {
            params: { keyword },
            ...getHeaders(token),
        });
        return response.data;
    } catch (error) {
        console.error(`Error searching messages in room ID ${roomId}:`, error);
        throw new Error("메시지 검색 중 오류가 발생했습니다.");
    }
};

// 메시지 삭제
export const deleteMessage = async (roomId, messageId, token) => {
    try {
        const response = await axios.delete(`${API_URL}/rooms/${roomId}/messages/${messageId}`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error deleting message with ID ${messageId} in room ID ${roomId}:`, error);
        throw new Error("메시지 삭제 중 오류가 발생했습니다.");
    }
};

// 파일 만료 설정
export const setFileExpiry = async (roomId, fileId, expiryDate, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/rooms/${roomId}/files/${fileId}/expiry`,
            { expiryDate }, getHeaders(token)
        );
        return response.data;
    } catch (error) {
        console.error(`Error setting file expiry for file ID ${fileId} in room ID ${roomId}:`, error);
        throw new Error("파일 만료 설정 중 오류가 발생했습니다.");
    }
};

// 채팅방의 읽음 통계 조회
export const fetchReadStatistics = async (roomId, token) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}/read-statistics`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error fetching read statistics for room ID ${roomId}:`, error);
        throw new Error("읽음 통계 조회 중 오류가 발생했습니다.");
    }
};

// 사용자 온라인 상태 업데이트
export const updateUserOnlineStatus = async (roomId, userId, isOnline, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/rooms/${roomId}/users/${userId}/online-status`,
            { isOnline }, getHeaders(token)
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating online status for user ID ${userId} in room ID ${roomId}:`, error);
        throw new Error("사용자 온라인 상태 업데이트 중 오류가 발생했습니다.");
    }
};

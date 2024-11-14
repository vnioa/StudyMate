// src/api/notificationAPI.js

import axios from 'axios';
import {API_URL} from '../config/apiurl'

// 공통 헤더 설정 함수 (인증 토큰 포함)
const getHeaders = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// 알림 목록 가져오기
export const fetchNotifications = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/list`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("알림 목록을 불러오는 중 오류가 발생했습니다.");
    }
};

// 특정 알림 읽음 상태 업데이트
export const markNotificationAsRead = async (notificationId, token) => {
    try {
        const response = await axios.put(`${API_URL}/${notificationId}/read`, {}, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error marking notification ID ${notificationId} as read:`, error);
        throw new Error("알림을 읽음 상태로 업데이트하는 중 오류가 발생했습니다.");
    }
};

// 모든 알림 읽음 상태로 업데이트
export const markAllNotificationsAsRead = async (token) => {
    try {
        const response = await axios.put(`${API_URL}/mark-all-read`, {}, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        throw new Error("모든 알림을 읽음 상태로 업데이트하는 중 오류가 발생했습니다.");
    }
};

// 특정 알림 삭제
export const deleteNotification = async (notificationId, token) => {
    try {
        const response = await axios.delete(`${API_URL}/${notificationId}`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error(`Error deleting notification ID ${notificationId}:`, error);
        throw new Error("특정 알림을 삭제하는 중 오류가 발생했습니다.");
    }
};

// 모든 알림 삭제
export const deleteAllNotifications = async (token) => {
    try {
        const response = await axios.delete(`${API_URL}/delete-all`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        throw new Error("모든 알림을 삭제하는 중 오류가 발생했습니다.");
    }
};

// 알림 설정 가져오기
export const fetchNotificationSettings = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/settings`, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error fetching notification settings:", error);
        throw new Error("알림 설정을 불러오는 중 오류가 발생했습니다.");
    }
};

// 알림 설정 업데이트
export const updateNotificationSettings = async (settings, token) => {
    try {
        const response = await axios.put(`${API_URL}/settings`, settings, getHeaders(token));
        return response.data;
    } catch (error) {
        console.error("Error updating notification settings:", error);
        throw new Error("알림 설정을 업데이트하는 중 오류가 발생했습니다.");
    }
};

// 특정 채팅방의 알림 음소거 설정
export const muteChatNotification = async (chatRoomId, isMuted, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/mute-chat/${chatRoomId}`,
            { isMuted }, getHeaders(token)
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating mute status for chat room ID ${chatRoomId}:`, error);
        throw new Error("채팅방 알림 음소거 설정 중 오류가 발생했습니다.");
    }
};

// 파일 전송 알림 설정
export const setFileTransferNotification = async (isEnabled, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/settings/file-transfer-notification`,
            { enabled: isEnabled }, getHeaders(token)
        );
        return response.data;
    } catch (error) {
        console.error("Error updating file transfer notification setting:", error);
        throw new Error("파일 전송 알림 설정 중 오류가 발생했습니다.");
    }
};

// 특정 이벤트 유형 알림 설정 업데이트
export const updateEventNotificationSetting = async (eventType, isEnabled, token) => {
    try {
        const response = await axios.put(
            `${API_URL}/settings/event/${eventType}`,
            { enabled: isEnabled }, getHeaders(token)
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating notification setting for event type ${eventType}:`, error);
        throw new Error("특정 이벤트 유형의 알림 설정 업데이트 중 오류가 발생했습니다.");
    }
};

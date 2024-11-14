// api/notifications.js

import axios from 'axios';
import {API_URL} from '../config/ApiUrl'

// 알림 설정 가져오기
export const fetchNotificationSettings = async () => {
    return await axios.get(`${API_URL}/notifications/settings`);
};

// 알림 설정 업데이트
export const updateNotificationSettings = async (settings) => {
    return await axios.post(`${API_URL}/notifications/settings`, settings);
};

// 특정 채팅방 음소거 설정
export const muteChannel = async (channelId, mute) => {
    return await axios.post(`${API_URL}/notifications/mute/${channelId}`, { mute });
};

// 파일 전송 알림 설정
export const setFileTransferAlert = async (enabled) => {
    return await axios.post(`${API_URL}/notifications/file-transfer`, { enabled });
};

// 채팅방 활동 알림 설정
export const setActivityNotification = async (enabled) => {
    return await axios.post(`${API_URL}/notifications/activity`, { enabled });
};

// features/social/services/chatService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

// API 인스턴스 생성
const api = axios.create({
    baseURL: API_ENDPOINTS.BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(handleError(error))
);

// 에러 처리 유틸리티
const handleError = (error) => {
    if (error.response) {
        const { status, data } = error.response;
        switch (status) {
            case 400:
                return new Error(data.message || '잘못된 요청입니다.');
            case 401:
                return new Error('인증이 필요합니다.');
            case 403:
                return new Error('접근 권한이 없습니다.');
            case 404:
                return new Error('요청한 리소스를 찾을 수 없습니다.');
            case 500:
                return new Error('서버 오류가 발생했습니다.');
            default:
                return new Error('알 수 없는 오류가 발생했습니다.');
        }
    }
    if (error.request) {
        return new Error('네트워크 연결을 확인해주세요.');
    }
    return new Error('요청 처리 중 오류가 발생했습니다.');
};

export const chatService = {
    // 채팅방 목록 조회
    getChatRooms: async () => {
        try {
            return await api.get(API_ENDPOINTS.CHAT.ROOMS);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 채팅방 생성
    createChatRoom: async (data) => {
        try {
            return await api.post(API_ENDPOINTS.CHAT.ROOMS, data);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 채팅방 정보 수정
    updateChatRoom: async (roomId, updates) => {
        try {
            return await api.put(`${API_ENDPOINTS.CHAT.ROOMS}/${roomId}`, updates);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 고정된 채팅방 목록 조회
    getPinnedChats: async () => {
        try {
            return await api.get(API_ENDPOINTS.CHAT.PINNED_CHATS);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 채팅방 삭제
    deleteChatRoom: async (roomId) => {
        try {
            await api.delete(`${API_ENDPOINTS.CHAT.ROOMS}/${roomId}`);
            return true;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 메시지 목록 조회
    getMessages: async (roomId, params = {}) => {
        try {
            return await api.get(`${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}`, { params });
        } catch (error) {
            throw handleError(error);
        }
    },

    // 메시지 전송
    sendMessage: async (roomId, messageData) => {
        try {
            return await api.post(`${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}`, messageData);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 메시지 수정
    updateMessage: async (roomId, messageId, updates) => {
        try {
            return await api.put(
                `${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}/${messageId}`,
                updates
            );
        } catch (error) {
            throw handleError(error);
        }
    },

    // 메시지 삭제
    deleteMessage: async (roomId, messageId) => {
        try {
            await api.delete(`${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}/${messageId}`);
            return true;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 읽지 않은 메시지 수 조회
    getUnreadCounts: async () => {
        try {
            return await api.get(API_ENDPOINTS.CHAT.UNREAD_COUNTS);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 채팅방 고정/해제
    togglePinChat: async (roomId) => {
        try {
            return await api.post(`${API_ENDPOINTS.CHAT.PIN}/${roomId}`);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 채팅방 알림 설정
    toggleMuteChat: async (roomId) => {
        try {
            return await api.post(`${API_ENDPOINTS.CHAT.MUTE}/${roomId}`);
        } catch (error) {
            throw handleError(error);
        }
    },

    // 파일 업로드
    uploadFile: async (roomId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            return await api.post(
                `${API_ENDPOINTS.CHAT.UPLOAD}/${roomId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
        } catch (error) {
            throw handleError(error);
        }
    },

    // 채팅방 참가자 관리
    updateParticipants: async (roomId, updates) => {
        try {
            return await api.put(
                `${API_ENDPOINTS.CHAT.PARTICIPANTS}/${roomId}`,
                updates
            );
        } catch (error) {
            throw handleError(error);
        }
    },

    // 캐시 관리
    clearCache: async () => {
        try {
            await AsyncStorage.multiRemove([
                'chat_rooms_cache',
                'messages_cache',
                'unread_counts_cache'
            ]);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
};

export default chatService;
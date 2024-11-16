// features/social/services/chatService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class ChatService {
    constructor() {
        this.api = axios.create({
            baseURL: API_ENDPOINTS.BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Request Interceptor
        this.api.interceptors.request.use(
            async (config) => {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response Interceptor
        this.api.interceptors.response.use(
            (response) => response.data,
            (error) => {
                return Promise.reject(this.handleError(error));
            }
        );
    }

    // 채팅방 목록 조회
    async getChatRooms() {
        try {
            const response = await this.api.get(API_ENDPOINTS.CHAT.ROOMS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 채팅방 생성
    async createChatRoom(data) {
        try {
            const response = await this.api.post(API_ENDPOINTS.CHAT.ROOMS, data);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 채팅방 정보 수정
    async updateChatRoom(roomId, updates) {
        try {
            const response = await this.api.put(`${API_ENDPOINTS.CHAT.ROOMS}/${roomId}`, updates);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 고정된 채팅방 목록 조회
    async getPinnedChats() {
        try {
            const response = await this.api.get(API_ENDPOINTS.CHAT.PINNED_CHATS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 채팅방 삭제
    async deleteChatRoom(roomId) {
        try {
            await this.api.delete(`${API_ENDPOINTS.CHAT.ROOMS}/${roomId}`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 메시지 목록 조회
    async getMessages(roomId, params = {}) {
        try {
            const response = await this.api.get(`${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}`, { params });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 메시지 전송
    async sendMessage(roomId, messageData) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}`, messageData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 메시지 수정
    async updateMessage(roomId, messageId, updates) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}/${messageId}`,
                updates
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 메시지 삭제
    async deleteMessage(roomId, messageId) {
        try {
            await this.api.delete(`${API_ENDPOINTS.CHAT.MESSAGES}/${roomId}/${messageId}`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 읽지 않은 메시지 수 조회
    async getUnreadCounts() {
        try {
            const response = await this.api.get(API_ENDPOINTS.CHAT.UNREAD_COUNTS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 채팅방 고정/해제
    async togglePinChat(roomId) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.CHAT.PIN}/${roomId}`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 채팅방 알림 설정
    async toggleMuteChat(roomId) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.CHAT.MUTE}/${roomId}`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 파일 업로드
    async uploadFile(roomId, file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await this.api.post(
                `${API_ENDPOINTS.CHAT.UPLOAD}/${roomId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 채팅방 참가자 관리
    async updateParticipants(roomId, updates) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.CHAT.PARTICIPANTS}/${roomId}`,
                updates
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 에러 처리
    handleError(error) {
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
    }

    // 캐시 관리
    async clearCache() {
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
}

export const chatService = new ChatService();
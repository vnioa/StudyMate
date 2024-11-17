// features/social/services/messageService.js
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { mediaUtils } from '../utils/mediaUtils';
import { validationUtils } from '../utils/validationUtils';

// API 인스턴스 생성
const api = axios.create({
    baseURL: `${API_BASE_URL}/messages`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 에러 처리 유틸리티
const handleError = (error, defaultMessage) => {
    if (error.response) {
        const { status, data } = error.response;
        switch (status) {
            case 400:
                throw new Error(data.message || '잘못된 요청입니다.');
            case 401:
                throw new Error('인증이 필요합니다.');
            case 403:
                throw new Error('권한이 없습니다.');
            case 404:
                throw new Error('메시지를 찾을 수 없습니다.');
            case 413:
                throw new Error('파일 크기가 너무 큽니다.');
            default:
                throw new Error(data.message || defaultMessage);
        }
    }
    throw new Error(error.message || defaultMessage);
};

export const messageService = {
    // API 요청 설정
    setAuthToken: (token) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    // 메시지 목록 조회
    getMessages: async (chatId, options = {}) => {
        try {
            validationUtils.validateChatId(chatId);
            const response = await api.get(`/${chatId}`, { params: options });
            return response.data;
        } catch (error) {
            throw handleError(error, '메시지 목록을 불러오는데 실패했습니다.');
        }
    },

    // 메시지 전송
    sendMessage: async (chatId, message) => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateMessage(message);

            const response = await api.post(`/${chatId}/send`, message);
            return response.data;
        } catch (error) {
            throw handleError(error, '메시지 전송에 실패했습니다.');
        }
    },

    // 메시지 수정
    editMessage: async (chatId, messageId, content) => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateMessageId(messageId);
            validationUtils.validateMessageContent(content);

            const response = await api.put(`/${chatId}/messages/${messageId}`, {
                content
            });
            return response.data;
        } catch (error) {
            throw handleError(error, '메시지 수정에 실패했습니다.');
        }
    },

    // 메시지 삭제
    deleteMessage: async (chatId, messageId) => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateMessageId(messageId);

            await api.delete(`/${chatId}/messages/${messageId}`);
            return true;
        } catch (error) {
            throw handleError(error, '메시지 삭제에 실패했습니다.');
        }
    },

    // 메시지 읽음 처리
    markAsRead: async (chatId, messageId) => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateMessageId(messageId);

            const response = await api.post(`/${chatId}/messages/${messageId}/read`);
            return response.data;
        } catch (error) {
            throw handleError(error, '메시지 읽음 처리에 실패했습니다.');
        }
    },

    // 미디어 메시지 전송
    sendMediaMessage: async (chatId, file, type = 'image') => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateFile(file);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const response = await api.post(`/${chatId}/media`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw handleError(error, '미디어 전송에 실패했습니다.');
        }
    },

    // 메시지 검색
    searchMessages: async (chatId, query, options = {}) => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateSearchQuery(query);

            const response = await api.get(`/${chatId}/search`, {
                params: {
                    query,
                    ...options
                }
            });
            return response.data;
        } catch (error) {
            throw handleError(error, '메시지 검색에 실패했습니다.');
        }
    },

    // 메시지 리액션 추가
    addReaction: async (chatId, messageId, reaction) => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateMessageId(messageId);
            validationUtils.validateReaction(reaction);

            const response = await api.post(
                `/${chatId}/messages/${messageId}/reactions`,
                { reaction }
            );
            return response.data;
        } catch (error) {
            throw handleError(error, '리액션 추가에 실패했습니다.');
        }
    },

    // 메시지 리액션 제거
    removeReaction: async (chatId, messageId, reaction) => {
        try {
            validationUtils.validateChatId(chatId);
            validationUtils.validateMessageId(messageId);
            validationUtils.validateReaction(reaction);

            await api.delete(
                `/${chatId}/messages/${messageId}/reactions/${reaction}`
            );
            return true;
        } catch (error) {
            throw handleError(error, '리액션 제거에 실패했습니다.');
        }
    }
};

export default messageService;
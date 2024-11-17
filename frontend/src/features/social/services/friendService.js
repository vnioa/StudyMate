// features/social/services/friendService.js
import axios from 'axios';
import { BASE_URL } from '../../../constants/apiEndpoints';
import { encryptionUtils } from '../utils/encryptionUtils';
import { validationUtils } from '../utils/validationUtils';

// API 인스턴스 생성
const api = axios.create({
    baseURL: `${BASE_URL}/friends`,
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
                throw new Error('찾을 수 없는 사용자입니다.');
            case 409:
                throw new Error('이미 존재하는 관계입니다.');
            default:
                throw new Error(data.message || defaultMessage);
        }
    }
    throw new Error(error.message || defaultMessage);
};

export const friendService = {
    // API 요청 설정
    setAuthToken: (token) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    // 친구 목록 조회
    getFriends: async () => {
        try {
            const response = await api.get('/');
            return response.data.friends;
        } catch (error) {
            throw handleError(error, '친구 목록을 불러오는데 실패했습니다.');
        }
    },

    // 차단된 사용자 목록 조회
    getBlockedUsers: async () => {
        try {
            const response = await api.get('/blocked');
            return response.data.blocked;
        } catch (error) {
            throw handleError(error, '차단 목록을 불러오는데 실패했습니다.');
        }
    },

    // 친구 검색
    searchFriends: async (query, options = {}) => {
        try {
            validationUtils.validateSearchQuery(query);
            const response = await api.get('/search', {
                params: {
                    query: encryptionUtils.encryptSearchQuery(query),
                    ...options
                }
            });
            return response.data.results;
        } catch (error) {
            throw handleError(error, '친구 검색에 실패했습니다.');
        }
    },

    // 친구 추천 목록 조회
    getFriendSuggestions: async () => {
        try {
            const response = await api.get('/suggestions');
            return response.data.suggestions;
        } catch (error) {
            throw handleError(error, '친구 추천 목록을 불러오는데 실패했습니다.');
        }
    },

    // 친구 추가
    addFriend: async (userId) => {
        try {
            validationUtils.validateUserId(userId);
            const response = await api.post('/add', { userId });
            return response.data.friend;
        } catch (error) {
            throw handleError(error, '친구 추가에 실패했습니다.');
        }
    },

    // 친구 삭제
    removeFriend: async (friendId) => {
        try {
            validationUtils.validateUserId(friendId);
            await api.delete(`/${friendId}`);
            return friendId;
        } catch (error) {
            throw handleError(error, '친구 삭제에 실패했습니다.');
        }
    },

    // 사용자 차단
    blockUser: async (userId) => {
        try {
            validationUtils.validateUserId(userId);
            const response = await api.post('/block', { userId });
            return response.data;
        } catch (error) {
            throw handleError(error, '사용자 차단에 실패했습니다.');
        }
    },

    // 차단 해제
    unblockUser: async (userId) => {
        try {
            validationUtils.validateUserId(userId);
            await api.post('/unblock', { userId });
            return userId;
        } catch (error) {
            throw handleError(error, '차단 해제에 실패했습니다.');
        }
    },

    // 친구 상태 업데이트
    updateFriendStatus: async (friendId, status) => {
        try {
            validationUtils.validateUserId(friendId);
            validationUtils.validateStatus(status);
            const response = await api.patch(`/${friendId}/status`, { status });
            return response.data;
        } catch (error) {
            throw handleError(error, '상태 업데이트에 실패했습니다.');
        }
    },

    // 친구 관계 확인
    checkFriendship: async (userId) => {
        try {
            validationUtils.validateUserId(userId);
            const response = await api.get(`/check/${userId}`);
            return response.data;
        } catch (error) {
            throw handleError(error, '친구 관계 확인에 실패했습니다.');
        }
    },

    // 상호 친구 목록 조회
    getMutualFriends: async (userId) => {
        try {
            validationUtils.validateUserId(userId);
            const response = await api.get(`/${userId}/mutual`);
            return response.data.mutualFriends;
        } catch (error) {
            throw handleError(error, '상호 친구 목록을 불러오는데 실패했습니다.');
        }
    },

    // 친구 목록 동기화
    syncFriends: async (friendIds) => {
        try {
            validationUtils.validateFriendIds(friendIds);
            const response = await api.post('/sync', { friendIds });
            return response.data;
        } catch (error) {
            throw handleError(error, '친구 목록 동기화에 실패했습니다.');
        }
    }
};

export default friendService;
// src/services/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API = axios.create({
    baseURL: 'https://api.studymate.com/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 토큰 처리
API.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 데이터 처리
API.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                const { data } = await API.post('/auth/refresh', { refreshToken });
                await AsyncStorage.setItem('token', data.token);
                API.defaults.headers.Authorization = `Bearer ${data.token}`;
                return API(originalRequest);
            } catch (refreshError) {
                await AsyncStorage.multiRemove(['token', 'refreshToken']);
            }
        }
        throw error;
    }
);

const api = {
    // user 관련 API 추가
    user: {
        updatePushToken: () => API.put('/user/push-token', {token}),
    },
    // API 초기화 메서드 추가
    initialize: async () => {
        try{
            // 저장된 토큰 확인
            const token = await AsyncStorage.getItem('token');
            if(token){
                API.defaults.headers.Authorization = `Bearer ${token}`;
            }
            // API 연결 상태 확인
            await API.get('/health-check');
            console.log('API initialized successfully');
            return true;
        }catch(error){
            console.error('API initialization failed: ', error);
            // 토큰 관련 에러인 경우 토큰 제거
            if(error.response?.status === 401){
                await AsyncStorage.multiRemove(['token', 'refreshToken']);
            }
            throw error;
        }
    },
    // 인증 관련 API
    auth: {
        login: (credentials) => API.post('/auth/login', credentials),
        register: (userData) => API.post('/auth/register', userData),
        logout: () => API.post('/auth/logout'),
        findId: (email) => API.post('/auth/find-id', { email }),
        resetPassword: (data) => API.post('/auth/reset-password', data),
        verifyEmail: (code) => API.post('/auth/verify-email', { code })
    },

    // 홈 관련 API
    home: {
        getDashboard: () => API.get('/home/dashboard'),
        getNotifications: () => API.get('/home/notifications'),
        readNotification: (id) => API.put(`/home/notifications/${id}/read`)
    },

    // 학습 관련 API
    study: {
        // 개인 학습
        getPersonalStudy: () => API.get('/study/personal'),
        startStudySession: (data) => API.post('/study/personal/sessions', data),
        endStudySession: (id) => API.put(`/study/personal/sessions/${id}/end`),

        // 그룹 학습
        getGroupStudy: (groupId) => API.get(`/study/group/${groupId}`),
        joinGroupStudy: (sessionId) => API.post(`/study/group/sessions/${sessionId}/join`),

        // 퀴즈
        getQuizzes: () => API.get('/study/quizzes'),
        startQuiz: (quizId) => API.post(`/study/quizzes/${quizId}/start`),
        submitQuiz: (quizId, answers) => API.post(`/study/quizzes/${quizId}/submit`, answers),

        // 학습 자료
        getMaterials: () => API.get('/study/materials'),
        uploadMaterial: (data) => {
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('type', data.type);
            formData.append('title', data.title);
            return API.post('/study/materials', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },

        // 통계
        getStatistics: () => API.get('/study/statistics'),

        // AI 추천
        getRecommendations: () => API.get('/study/ai-recommendations')
    },

    // 그룹 관련 API
    group: {
        getGroups: () => API.get('/groups'),
        createGroup: (data) => API.post('/groups', data),
        getGroupDetail: (id) => API.get(`/groups/${id}`),
        updateGroup: (id, data) => API.put(`/groups/${id}`, data),
        deleteGroup: (id) => API.delete(`/groups/${id}`),

        // 멤버 관리
        getMembers: (groupId) => API.get(`/groups/${groupId}/members`),
        inviteMember: (groupId, userId) => API.post(`/groups/${groupId}/members/invite`, { userId }),
        removeMember: (groupId, userId) => API.delete(`/groups/${groupId}/members/${userId}`),
        updateMemberRole: (groupId, userId, role) => API.put(`/groups/${groupId}/members/${userId}/role`, { role }),

        // 그룹 활동
        getActivities: (groupId) => API.get(`/groups/${groupId}/activities`),
        createActivity: (groupId, data) => API.post(`/groups/${groupId}/activities`, data)
    },

    // 친구 관련 API
    friend: {
        getFriends: () => API.get('/friends'),
        getFriendDetail: (id) => API.get(`/friends/${id}`),
        searchFriends: (query) => API.get('/friends/search', { params: { query } }),
        addFriend: (id) => API.post('/friends/requests', { userId: id }),
        acceptRequest: (id) => API.post(`/friends/requests/${id}/accept`),
        rejectRequest: (id) => API.post(`/friends/requests/${id}/reject`),
        getFriendRequests: () => API.get('/friends/requests'),
        removeFriend: (id) => API.delete(`/friends/${id}`)
    },

    // 채팅 관련 API
    chat: {
        getRooms: () => API.get('/chat/rooms'),
        createRoom: (data) => API.post('/chat/rooms', data),
        getRoomDetail: (id) => API.get(`/chat/rooms/${id}`),
        getMessages: (roomId) => API.get(`/chat/rooms/${roomId}/messages`),
        sendMessage: (roomId, message) => API.post(`/chat/rooms/${roomId}/messages`, { message }),
        deleteRoom: (id) => API.delete(`/chat/rooms/${id}`),
        markAsRead: (id) => API.put(`/chat/rooms/${id}/read`),
        togglePin: (id) => API.put(`/chat/rooms/${id}/pin`),


        // 화상 통화
        startVideoCall: (roomId) => API.post(`/chat/rooms/${roomId}/video-call/start`),
        endVideoCall: (roomId) => API.post(`/chat/rooms/${roomId}/video-call/end`),

        // 파일 공유
        uploadFile: (roomId, file) => {
            const formData = new FormData();
            formData.append('file', file);
            return API.post(`/chat/rooms/${roomId}/files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
    },

    // 프로필 관련 API
    profile: {
        getProfile: () => API.get('/profile'),
        updateProfile: (data) => API.put('/profile', data),
        updateAvatar: (file) => {
            const formData = new FormData();
            formData.append('avatar', file);
            return API.put('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },

        // 설정
        getSettings: () => API.get('/profile/settings'),
        updateSettings: (data) => API.put('/profile/settings', data),

        // 업적
        getAchievements: () => API.get('/profile/achievements')
    }
};

export default api;
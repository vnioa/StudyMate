// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from "react-native";

const BASE_URL = 'http://121.127.165.43:3000'

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 추가
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 추가
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // 토큰 만료 등의 인증 에러 처리
            await AsyncStorage.removeItem('userToken');
            // 로그인 화면으로 리다이렉트
            const RootNavigation = {
                navigate: (name, params) => {
                    if (navigationRef.current) {
                        navigationRef.current.navigate(name, params);
                    }
                },
            };
            RootNavigation.navigate('Login', {
                message: '세션이 만료되었습니다. 다시 로그인해주세요.'
            });
        } else if (error.response?.status === 403) {
            // 권한 없음 처리
            Alert.alert('접근 권한이 없습니다');
        } else if (error.response?.status === 500) {
            // 서버 에러 처리
            Alert.alert('서버 오류가 발생했습니다');
        } else {
            // 기타 에러 처리
            Alert.alert('오류가 발생했습니다', error.message);
        }
        return Promise.reject(error);
    }
);

// API 엔드포인트들
const authAPI = {
    // 아이디/비밀번호 찾기
    verifyAuthCode: (data) => api.post('/auth/verify-code', data),
    findId: (data) => api.post('/auth/find/id', data),

    // 일반 로그인
    login: (credentials) => api.post('/auth/login', credentials),

    // 소셜 로그인
    googleLogin: (token) => api.post('/auth/google', {token}),
    kakaoLogin: (token) => api.post('/auth/kakao', {token}),
    naverLogin: (token) => api.post('/auth/naver', {token}),

    // 토큰 검증
    verifyToken: () => api.get('/auth/verify'),

    // 로그아웃
    logout: () => api.post('/auth/logout'),

    // 비밀번호 재설정
    resetPassword: (data) => api.post('/auth/reset-password', data),
    updatePassword: (data) => api.put('/auth/password', data),

    // 회원가입
    register: (userData) => api.post('/auth/register', userData),
    checkUsername: (data) => api.post('/auth/check-username', data),
    sendAuthCode: (data) => api.post('/auth/send-code', data),

    // 유효성 검증
    validateUsername: (username) => api.post('/auth/validate/username', {username}),
    validateEmail: (email) => api.post('/auth/validate/email', {email}),
    validatePassword: (password) => api.post('/auth/validate/password', {password}),
};

const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (userData) => api.put('/user/profile', userData),
    updatePassword: (passwords) => api.put('/user/password', passwords),
};

const studyAPI = {
    getDashboard: () => api.get('/study/dashboard'),
    getStatistics: () => api.get('/study/statistics'),
    updateGoals: (goals) => api.put('/study/goals', goals),
};

const groupAPI = {
    getGroups: () => api.get('/groups'),
    createGroup: (groupData) => api.post('/groups', groupData),
    getGroupDetails: (groupId) => api.get(`/groups/${groupId}`),
    joinGroup: (groupId) => api.post(`/groups/${groupId}/join`),
};

const chatAPI = {
    // 채팅 목록 및 알림 관리
    getUnreadCount: () => api.get('/chat/unread-count'),
    getChatList: () => api.get('/chat/list'),
    markAllAsRead: () => api.put('/chat/mark-all-read'),

    // 새 채팅방 생성
    createNewChat: (userIds) => api.post('/chat/rooms', {userIds}),
    searchUsers: (query) => api.get(`/chat/users/search?q=${query}`),

    // 친구 관련
    getFriends: (params) => api.get('/friends/list', {params}),
    getFriendRequests: () => api.get('/friends/requests'),
    addFriend: (userId) => api.post('/friends/add', {userId}),
    acceptFriendRequest: (requestId) => api.put(`/friends/requests/${requestId}/accept`),
    rejectFriendRequest: (requestId) => api.put(`/friends/requests/${requestId}/reject`),

    // 채팅방 목록 관련
    getChatRooms: () => api.get('/chat/rooms'),
    pinChatRoom: (roomId, isPinned) => api.put(`/chat/rooms/${roomId}/pin`, {isPinned}),

    // 채팅방 검색
    searchChatRooms: (query) => api.get(`/chat/rooms/search?q=${query}`),

    // 읽음 처리
    markAsRead: (roomId) => api.put(`/chat/rooms/${roomId}/read`),

    // 채팅방 메타데이터
    getRoomMetadata: (roomId) => api.get(`/chat/rooms/${roomId}/metadata`),
};

export {
    api as default,
    authAPI,
    userAPI,
    studyAPI,
    groupAPI,
    chatAPI,
};
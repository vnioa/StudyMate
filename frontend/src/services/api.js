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
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    resetPassword: (email) => api.post('/auth/reset-password', { email }),
    sendAuthCode: (data) => api.post('/users/find/send-auth-code', data),
    verifyAuthCode: (data) => api.post('/users/find/verify-code', data),
    findId: (data) => api.post('/users/find/id', data),
    googleLogin: (token) => api.post('/users/login/google', token),
    kakaoLogin: (token) => api.post('/users/login/kakao', token),
    naverLogin: (token) => api.post('/users/login/naver', token),
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
    getRooms: () => api.get('/chat/rooms'),
    getMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages`),
    sendMessage: (roomId, message) => api.post(`/chat/rooms/${roomId}/messages`, { message }),
    getRoom: (roomId) => api.get(`/chat/rooms/${roomId}`),
    createRoom: () => api.post('/chat/rooms'),
    togglePin: (roomId) => api.put(`/chat/rooms/${roomId}/pin`),
    updateRoomSettings: (roomId, settings) => api.put(`/chat/rooms/${roomId}/settings`, settings),
};

export {
    api as default,
    authAPI,
    userAPI,
    studyAPI,
    groupAPI,
    chatAPI,
};
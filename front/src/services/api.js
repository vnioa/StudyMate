import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from "../config/apiUrl";
import {Alert} from "react-native";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
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

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('token');
            // 다른 인증 관련 데이터도 제거
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('refreshToken');

            // 전역 상태 초기화 (Redux 사용 시)
            store.dispatch({ type: 'LOGOUT' });

            // 네비게이션 리다이렉트
            const navigation = navigationRef.current;
            if (navigation) {
                // 스택 초기화 후 로그인 화면으로 이동
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }]
                });
            }
        }

        // 다른 에러 상태 처리
        if (error.response?.status === 403) {
            // 권한 없음 처리
            Alert.alert('접근 권한이 없습니다');
        } else if (error.response?.status === 500) {
            // 서버 에러 처리
            Alert.alert('서버 오류가 발생했습니다');
        }

        return Promise.reject(error);
    }
);

const authAPI = {
    login: (username, password) =>
        api.post('/auth/login', { username, password }),

    register: (userData) =>
        api.post('/auth/register', userData),

    checkUsername: (username) =>
        api.post('/auth/check-username', { username }),

    sendVerificationCode: (email) =>
        api.post('/auth/verify-email', { email }),

    findId: (name, email) =>
        api.post('/auth/find-id', { name, email }),

    resetPassword: (username, newPassword) =>
        api.post('/auth/reset-password', { username, newPassword })
};

const chatAPI = {
    getRooms: () =>
        api.get('/chat/rooms'),

    getMessages: (roomId) =>
        api.get(`/chat/rooms/${roomId}/messages`),

    sendMessage: (roomId, content, type = 'text') =>
        api.post(`/chat/rooms/${roomId}/messages`, { content, type }),

    uploadFile: (roomId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/chat/rooms/${roomId}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

const friendAPI = {
    getFriends: () =>
        api.get('/friends'),

    getFriendProfile: (friendId) =>
        api.get(`/friends/${friendId}`),

    sendFriendRequest: (toUserId) =>
        api.post('/friends/request', { toUserId }),

    respondToRequest: (requestId, accept) =>
        api.post(`/friends/request/${requestId}/respond`, { accept }),

    blockUser: (userId) =>
        api.post('/friends/block', { blockedUserId: userId }),

    unblockUser: (userId) =>
        api.delete(`/friends/block/${userId}`)
};

export { api, authAPI, chatAPI, friendAPI };
// features/auth/services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

// API 인스턴스 생성
const api = axios.create({
    baseURL: API_ENDPOINTS.BASE_URL,
    timeout: 10000,
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

export const authService = {
    // 로그인
    login: async ({ email, password }) => {
        try {
            const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
                email,
                password
            });
            if (response.token) {
                await AsyncStorage.setItem('token', response.token);
            }
            return response;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 회원가입
    signUp: async (userData) => {
        try {
            const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
            return response;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 로그아웃
    logout: async () => {
        try {
            await api.post(API_ENDPOINTS.AUTH.LOGOUT);
            await AsyncStorage.removeItem('token');
            return true;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 이메일 인증
    verifyEmail: async (code) => {
        try {
            const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { code });
            return response;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 비밀번호 재설정
    resetPassword: async ({ email, code, newPassword }) => {
        try {
            const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                email,
                code,
                newPassword
            });
            return response;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 소셜 로그인
    socialLogin: async (provider, token) => {
        try {
            const response = await api.post(API_ENDPOINTS.AUTH.SOCIAL_LOGIN[provider], { token });
            if (response.token) {
                await AsyncStorage.setItem('token', response.token);
            }
            return response;
        } catch (error) {
            throw handleError(error);
        }
    },

    // 토큰 관리
    getToken: async () => {
        return await AsyncStorage.getItem('token');
    },

    setToken: async (token) => {
        await AsyncStorage.setItem('token', token);
    },

    removeToken: async () => {
        await AsyncStorage.removeItem('token');
    },

    // 토큰 검증
    validateToken: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return null;

            const response = await api.post(API_ENDPOINTS.AUTH.VALIDATE_TOKEN);
            return response;
        } catch (error) {
            await AsyncStorage.removeItem('token');
            throw handleError(error);
        }
    }
};

export default authService;
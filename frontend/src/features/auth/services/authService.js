// services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: API_ENDPOINTS.BASE_URL,
            timeout: 10000,
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

    // 로그인
    async login(username, password) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.LOGIN, {
                username,
                password
            });
            if (response.token) {
                await AsyncStorage.setItem('token', response.token);
            }
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 회원가입
    async register(userData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 로그아웃
    async logout() {
        try {
            await this.api.post(API_ENDPOINTS.AUTH.LOGOUT);
            await AsyncStorage.removeItem('token');
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 토큰 검증
    async validateToken(token) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { token });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 아이디 중복 확인
    async checkUsername(username) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.CHECK_USERNAME, { username });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 이메일 인증 코드 발송
    async sendVerificationCode(email) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { email });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 아이디 찾기
    async findId(data) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.FIND_ID, data);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 비밀번호 재설정
    async resetPassword(data) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 비밀번호 변경
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
                currentPassword,
                newPassword
            });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 소셜 로그인 - Google
    async loginWithGoogle(token) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.SOCIAL_LOGIN.GOOGLE, { token });
            if (response.token) {
                await AsyncStorage.setItem('token', response.token);
            }
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 소셜 로그인 - Kakao
    async loginWithKakao(code) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.SOCIAL_LOGIN.KAKAO, { code });
            if (response.token) {
                await AsyncStorage.setItem('token', response.token);
            }
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 소셜 로그인 - Naver
    async loginWithNaver(code) {
        try {
            const response = await this.api.post(API_ENDPOINTS.AUTH.SOCIAL_LOGIN.NAVER, { code });
            if (response.token) {
                await AsyncStorage.setItem('token', response.token);
            }
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

    // 토큰 관리
    async getToken() {
        return await AsyncStorage.getItem('token');
    }

    async setToken(token) {
        await AsyncStorage.setItem('token', token);
    }

    async removeToken() {
        await AsyncStorage.removeItem('token');
    }
}

export const authService = new AuthService();
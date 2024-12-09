import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터
api.interceptors.request.use(
    async (config) => {
        const accessToken = await SecureStore.getItemAsync('userToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Access Token 만료 시
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) {
                    throw new Error('Refresh Token not found');
                }

                const refreshResponse = await api.post('/api/auth/refresh', { refreshToken });

                if (refreshResponse.data.success) {
                    const newAccessToken = refreshResponse.data.accessToken;

                    // 새 Access Token 저장
                    await SecureStore.setItemAsync('userToken', newAccessToken);

                    // 헤더에 새 Access Token 포함
                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                    // 이전 요청 재시도
                    return api(originalRequest);
                } else {
                    throw new Error('Failed to refresh token');
                }
            } catch (refreshError) {
                console.error('토큰 갱신 실패:', refreshError);
                // 로그아웃 처리 또는 로그인 화면으로 이동
                Alert.alert('세션 만료', '다시 로그인해주세요.');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

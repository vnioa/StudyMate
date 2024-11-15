// features/home/services/learningService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class LearningService {
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

    // 맞춤형 학습 콘텐츠 조회
    async getPersonalizedContent() {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING.PERSONALIZED_CONTENT);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 인기 학습 콘텐츠 조회
    async getPopularContent() {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING.POPULAR_CONTENT);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // updateContent 메서드 추가
    async updateContent(contentId, updates) {
        try {
            const response = await this.api.put(`${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}`, updates);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // addContent 메서드 추가
    async addContent(contentData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.LEARNING.CONTENT, contentData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // removeContent 메서드 추가
    async removeContent(contentId) {
        try {
            await this.api.delete(`${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // updateProgress 메서드 추가
    async updateProgress(contentId, progress) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}/progress`,
                { progress }
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // shareContent 메서드 추가
    async shareContent(contentId) {
        try {
            const response = await this.api.post(
                `${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}/share`
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 추천 콘텐츠 조회
    async getRecommendations() {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING.RECOMMENDATIONS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 히스토리 조회
    async getLearningHistory() {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING.LEARNING_HISTORY);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 통계 조회
    async getLearningStatistics() {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING.STATISTICS);
            return {
                totalLearningTime: response.totalLearningTime,
                completedContents: response.completedContents,
                averageRating: response.averageRating,
                streak: response.streak
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 콘텐츠 상세 정보 조회
    async getContentDetails(contentId) {
        try {
            const response = await this.api.get(`${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 콘텐츠 진행도 업데이트
    async updateContentProgress(contentId, progress) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}/progress`,
                { progress }
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 콘텐츠 평가
    async rateContent(contentId, rating) {
        try {
            const response = await this.api.post(
                `${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}/rate`,
                { rating }
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 북마크 토글
    async toggleBookmark(contentId) {
        try {
            const response = await this.api.post(
                `${API_ENDPOINTS.LEARNING.CONTENT}/${contentId}/bookmark`
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 콘텐츠 검색
    async searchContent(query, filters = {}) {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING.SEARCH_CONTENT, {
                params: { query, ...filters }
            });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 콘텐츠 필터링
    async filterContent(filters) {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING.FILTER_CONTENT, {
                params: filters
            });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 진도 동기화
    async syncProgress(progressData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.LEARNING.SYNC_PROGRESS, progressData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 오프라인 데이터 업로드
    async uploadOfflineData(offlineData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.LEARNING.OFFLINE_DATA, offlineData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 통계 내보내기
    async exportStatistics(format = 'pdf') {
        try {
            const response = await this.api.get(
                `${API_ENDPOINTS.LEARNING.EXPORT}?format=${format}`,
                { responseType: 'blob' }
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
                'personalized_content_cache',
                'popular_content_cache',
                'recommendations_cache',
                'learning_history_cache',
                'learning_statistics_cache'
            ]);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
}

export const learningService = new LearningService();
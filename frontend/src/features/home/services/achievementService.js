// features/home/services/achievementService.js
import axios from 'axios';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AchievementService {
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
    }

    // 성과 배지 및 진행도 데이터 조회
    async getAchievements() {
        try {
            const response = await this.api.get(API_ENDPOINTS.ACHIEVEMENTS);
            return {
                badges: response.data.badges,
                progress: response.data.progress,
                stats: response.data.stats
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 최근 획득한 배지 조회
    async getRecentBadges() {
        try {
            const response = await this.api.get(API_ENDPOINTS.RECENT_BADGES);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 진행도 조회
    async getLearningProgress() {
        try {
            const response = await this.api.get(API_ENDPOINTS.LEARNING_PROGRESS);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 통계 조회
    async getStudyStatistics() {
        try {
            const response = await this.api.get(API_ENDPOINTS.STUDY_STATISTICS);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 배지 상세 정보 조회
    async getBadgeDetails(badgeId) {
        try {
            const response = await this.api.get(`${API_ENDPOINTS.BADGES}/${badgeId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 진행도 업데이트
    async updateProgress(progressData) {
        try {
            const response = await this.api.put(
                API_ENDPOINTS.UPDATE_PROGRESS,
                progressData
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 새로운 배지 획득 시 처리
    async claimNewBadge(badgeId) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.CLAIM_BADGE}/${badgeId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 배지 공유
    async shareBadge(badgeId, platform) {
        try {
            const response = await this.api.post(API_ENDPOINTS.SHARE_BADGE, {
                badgeId,
                platform
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 통계 내보내기
    async exportStatistics(format = 'pdf') {
        try {
            const response = await this.api.get(API_ENDPOINTS.EXPORT_STATISTICS, {
                params: { format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 진행도 동기화
    async syncProgress(progressData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.SYNC_PROGRESS, progressData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 에러 처리
    handleError(error) {
        if (error.response) {
            // 서버 응답 에러
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
            // 네트워크 오류
            return new Error('네트워크 연결을 확인해주세요.');
        }
        // 기타 오류
        return new Error('요청 처리 중 오류가 발생했습니다.');
    }

    // 캐시 관리
    async clearCache() {
        try {
            await AsyncStorage.multiRemove([
                'achievements_cache',
                'badges_cache',
                'statistics_cache'
            ]);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
}

export const achievementService = new AchievementService();
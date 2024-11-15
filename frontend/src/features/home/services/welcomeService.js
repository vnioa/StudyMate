// features/home/services/welcomeService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class WelcomeService {
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

    // 사용자 데이터 조회
    async getUserData() {
        try {
            const response = await this.api.get(API_ENDPOINTS.HOME.WELCOME);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 오늘의 목표 조회
    async getTodayGoals() {
        try {
            const response = await this.api.get(API_ENDPOINTS.HOME.TODAY_GOALS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 마일스톤 조회
    async getMilestones() {
        try {
            const response = await this.api.get(API_ENDPOINTS.HOME.MILESTONES);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 마일스톤 통계 조회
    async getMilestoneStatistics() {
        try {
            const response = await this.api.get(API_ENDPOINTS.HOME.MILESTONE_STATISTICS);
            return {
                totalMilestones: response.totalMilestones,
                completedMilestones: response.completedMilestones,
                upcomingMilestones: response.upcomingMilestones,
                achievementRate: response.achievementRate,
                monthlyProgress: response.monthlyProgress,
                recentAchievements: response.recentAchievements,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 알림 조회
    async getNotifications() {
        try {
            const response = await this.api.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 학습 통계 조회
    async getStudyStats() {
        try {
            const response = await this.api.get(API_ENDPOINTS.HOME.STUDY_STATISTICS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 진행도 업데이트
    async updateGoalProgress(goalId, progress) {
        try {
            const response = await this.api.put(`${API_ENDPOINTS.GOALS.PROGRESS}/${goalId}`, {
                progress
            });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 마일스톤 추가
    async addMilestone(milestoneData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.HOME.MILESTONES, milestoneData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 알림 읽음 처리
    async markNotificationAsRead(notificationId) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.NOTIFICATIONS.READ}/${notificationId}`
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 알림 전체 읽음 처리
    async markAllNotificationsAsRead() {
        try {
            const response = await this.api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 시간대별 메시지 생성
    getTimeBasedMessage() {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return '좋은 아침입니다! 오늘도 힘찬 하루 되세요.';
        } else if (hour >= 12 && hour < 17) {
            return '열심히 공부하고 계시네요! 오늘도 화이팅!';
        } else if (hour >= 17 && hour < 21) {
            return '저녁 시간에도 학습하시는 모습이 멋져요!';
        } else {
            return '늦은 시간까지 열심히 하시는군요! 무리하지 마세요.';
        }
    }

    // 학습 성과 요약 조회
    async getAchievementsSummary() {
        try {
            const response = await this.api.get(API_ENDPOINTS.HOME.ACHIEVEMENTS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 주간 학습 리포트 조회
    async getWeeklyReport() {
        try {
            const response = await this.api.get(API_ENDPOINTS.ANALYTICS.LEARNING);
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
                'welcome_data_cache',
                'today_goals_cache',
                'milestones_cache',
                'notifications_cache',
                'study_stats_cache',
                'milestone_statistics_cache'  // 마일스톤 통계 캐시 추가
            ]);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
}

export const welcomeService = new WelcomeService();
// features/home/services/goalService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class GoalService {
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

    // 오늘의 목표 조회
    async getTodayGoals() {
        try {
            const response = await this.api.get(API_ENDPOINTS.TODAY_GOALS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 진행도 조회
    async getGoalProgress() {
        try {
            const response = await this.api.get(API_ENDPOINTS.GOAL_PROGRESS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // AI 피드백 조회
    async getAIFeedback() {
        try {
            const response = await this.api.get(API_ENDPOINTS.AI_FEEDBACK);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 리마인더 조회
    async getReminders() {
        try {
            const response = await this.api.get(API_ENDPOINTS.REMINDERS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 생성
    async createGoal(goalData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.GOALS, goalData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 수정
    async updateGoal(goalId, updates) {
        try {
            const response = await this.api.put(`${API_ENDPOINTS.GOALS}/${goalId}`, updates);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 삭제
    async deleteGoal(goalId) {
        try {
            await this.api.delete(`${API_ENDPOINTS.GOALS}/${goalId}`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 진행도 업데이트
    async updateGoalProgress(goalId, progress) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.GOALS}/${goalId}/progress`,
                { progress }
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 리마인더 토글
    async toggleReminder(reminderId) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.REMINDERS}/${reminderId}/toggle`
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 우선순위 업데이트
    async updateGoalPriority(goalId, priority) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.GOALS}/${goalId}/priority`,
                { priority }
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 달성 체크
    async completeGoal(goalId) {
        try {
            const response = await this.api.put(`${API_ENDPOINTS.GOALS}/${goalId}/complete`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 통계 조회
    async getGoalStatistics() {
        try {
            const response = await this.api.get(API_ENDPOINTS.GOAL_STATISTICS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 내보내기
    async exportGoals(format = 'pdf') {
        try {
            const response = await this.api.get(`${API_ENDPOINTS.EXPORT_GOALS}?format=${format}`, {
                responseType: 'blob'
            });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 템플릿 조회
    async getGoalTemplates() {
        try {
            const response = await this.api.get(API_ENDPOINTS.GOAL_TEMPLATES);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 목표 공유
    async shareGoal(goalId, platform) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.GOALS}/${goalId}/share`, {
                platform
            });
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
                'goals_cache',
                'reminders_cache',
                'statistics_cache'
            ]);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
}

export const goalService = new GoalService();
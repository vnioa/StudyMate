// features/home/services/studyGroupService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class StudyGroupService {
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

    // 그룹 목록 조회
    async getGroups() {
        try {
            const response = await this.api.get(API_ENDPOINTS.GROUPS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 커뮤니티 피드 조회
    async getCommunityFeed() {
        try {
            const response = await this.api.get(API_ENDPOINTS.COMMUNITY_FEED);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 알림 조회
    async getGroupNotifications() {
        try {
            const response = await this.api.get(API_ENDPOINTS.GROUP_NOTIFICATIONS);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 상세 정보 조회
    async getGroupDetails(groupId) {
        try {
            const response = await this.api.get(`${API_ENDPOINTS.GROUPS}/${groupId}`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 생성
    async createGroup(groupData) {
        try {
            const response = await this.api.post(API_ENDPOINTS.GROUPS, groupData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 수정
    async updateGroup(groupId, updates) {
        try {
            const response = await this.api.put(`${API_ENDPOINTS.GROUPS}/${groupId}`, updates);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 삭제
    async deleteGroup(groupId) {
        try {
            await this.api.delete(`${API_ENDPOINTS.GROUPS}/${groupId}`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 멤버 초대
    async inviteMembers(groupId, memberIds) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.GROUPS}/${groupId}/invite`, {
                memberIds
            });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 참여
    async joinGroup(groupId) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.GROUPS}/${groupId}/join`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 탈퇴
    async leaveGroup(groupId) {
        try {
            const response = await this.api.post(`${API_ENDPOINTS.GROUPS}/${groupId}/leave`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 게시글 작성
    async createPost(groupId, postData) {
        try {
            const response = await this.api.post(
                `${API_ENDPOINTS.GROUPS}/${groupId}/posts`,
                postData
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 게시글 삭제
    async deletePost(groupId, postId) {
        try {
            await this.api.delete(`${API_ENDPOINTS.GROUPS}/${groupId}/posts/${postId}`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 일정 생성
    async createSchedule(groupId, scheduleData) {
        try {
            const response = await this.api.post(
                `${API_ENDPOINTS.GROUPS}/${groupId}/schedules`,
                scheduleData
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 일정 수정
    async updateSchedule(groupId, scheduleId, updates) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.GROUPS}/${groupId}/schedules/${scheduleId}`,
                updates
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 진행도 업데이트
    async updateGroupProgress(groupId, progress) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.GROUPS}/${groupId}/progress`,
                { progress }
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 통계 조회
    async getGroupStatistics(groupId) {
        try {
            const response = await this.api.get(`${API_ENDPOINTS.GROUPS}/${groupId}/statistics`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 알림 읽음 처리
    async markNotificationAsRead(notificationId) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`
            );
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // 그룹 멤버 권한 설정
    async updateMemberRole(groupId, memberId, role) {
        try {
            const response = await this.api.put(
                `${API_ENDPOINTS.GROUPS}/${groupId}/members/${memberId}/role`,
                { role }
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
                'groups_cache',
                'community_feed_cache',
                'group_notifications_cache'
            ]);
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }
}

export const studyGroupService = new StudyGroupService();
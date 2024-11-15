// features/home/hooks/useStudyGroup.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { studyGroupService } from '../services/studyGroupService';
import {
    setStudyGroupData,
    setLoading,
    setError,
    updateGroup,
    addPost,
    removePost,
    updateNotification,
    setRefreshing,
    resetStudyGroupState
} from '../store/slices/studyGroupSlice';

export const useStudyGroup = () => {
    const dispatch = useDispatch();
    const { data, loading, error } = useSelector(state => state.studyGroup);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 스터디 그룹 데이터 가져오기
    const fetchStudyGroupData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }

            // 여러 API 동시 호출
            const [groupsData, feedData, notificationsData] = await Promise.all([
                studyGroupService.getGroups(),
                studyGroupService.getCommunityFeed(),
                studyGroupService.getGroupNotifications()
            ]);

            // 데이터 통합
            const combinedData = {
                groups: groupsData,
                communityPosts: feedData,
                notifications: notificationsData,
                lastUpdated: new Date().toISOString()
            };

            dispatch(setStudyGroupData(combinedData));
            dispatch(setError(null));

        } catch (err) {
            dispatch(setError(err.message || '스터디 그룹 데이터를 불러오는데 실패했습니다.'));
            console.error('Study Group Data Fetch Error:', err);
        } finally {
            if (showLoading) {
                dispatch(setLoading(false));
            }
        }
    }, [dispatch]);

    // 새로고침
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchStudyGroupData(false);
        setIsRefreshing(false);
    }, [fetchStudyGroupData]);

    // 그룹 진행도 업데이트
    const updateGroupProgress = useCallback(async (groupId, progress) => {
        try {
            const response = await studyGroupService.updateGroupProgress(groupId, progress);
            dispatch(updateGroup({ groupId, updates: { progress: response.progress } }));
            return response;
        } catch (err) {
            console.error('Group Progress Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 커뮤니티 게시글 작성
    const createPost = useCallback(async (groupId, postData) => {
        try {
            const response = await studyGroupService.createPost(groupId, postData);
            dispatch(addPost(response));
            return response;
        } catch (err) {
            console.error('Post Creation Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 게시글 삭제
    const deletePost = useCallback(async (groupId, postId) => {
        try {
            await studyGroupService.deletePost(groupId, postId);
            dispatch(removePost(postId));
        } catch (err) {
            console.error('Post Deletion Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 알림 읽음 처리
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const response = await studyGroupService.markNotificationAsRead(notificationId);
            dispatch(updateNotification({
                notificationId,
                updates: { isRead: true }
            }));
            return response;
        } catch (err) {
            console.error('Notification Update Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 그룹 통계 조회
    const getGroupStatistics = useCallback(async (groupId) => {
        try {
            return await studyGroupService.getGroupStatistics(groupId);
        } catch (err) {
            console.error('Group Statistics Error:', err);
            throw err;
        }
    }, []);

    // 그룹 일정 관리
    const createSchedule = useCallback(async (groupId, scheduleData) => {
        try {
            const response = await studyGroupService.createSchedule(groupId, scheduleData);
            dispatch(updateGroup({
                groupId,
                updates: { schedules: response.schedules }
            }));
            return response;
        } catch (err) {
            console.error('Schedule Creation Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 학습 자료 업로드
    const uploadResource = useCallback(async (groupId, resourceData) => {
        try {
            const response = await studyGroupService.uploadResource(groupId, resourceData);
            dispatch(updateGroup({
                groupId,
                updates: { resources: response.resources }
            }));
            return response;
        } catch (err) {
            console.error('Resource Upload Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 초기 데이터 로드
    useEffect(() => {
        fetchStudyGroupData();

        // 컴포넌트 언마운트 시 상태 초기화
        return () => {
            dispatch(resetStudyGroupState());
        };
    }, [dispatch, fetchStudyGroupData]);

    // 주기적인 데이터 갱신 (5분마다)
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchStudyGroupData(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [fetchStudyGroupData]);

    return {
        // 기본 데이터
        groups: data.groups,
        communityPosts: data.communityPosts,
        notifications: data.notifications,
        lastUpdated: data.lastUpdated,

        // 상태
        loading,
        error,
        isRefreshing,

        // 액션
        refresh,
        updateGroupProgress,
        createPost,
        deletePost,
        markAsRead,
        getGroupStatistics,
        createSchedule,
        uploadResource
    };
};

export default useStudyGroup;
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from "react-native";

const BASE_URL = 'http://121.127.165.43:3000'

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 추가
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 추가
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // 토큰 만료 등의 인증 에러 처리
            await AsyncStorage.removeItem('userToken');
            // 로그인 화면으로 리다이렉트
            const RootNavigation = {
                navigate: (name, params) => {
                    if (navigationRef.current) {
                        navigationRef.current.navigate(name, params);
                    }
                },
            };
            RootNavigation.navigate('Login', {
                message: '세션이 만료되었습니다. 다시 로그인해주세요.'
            });
        } else if (error.response?.status === 403) {
            // 권한 없음 처리
            Alert.alert('접근 권한이 없습니다');
        } else if (error.response?.status === 500) {
            // 서버 에러 처리
            Alert.alert('서버 오류가 발생했습니다');
        } else {
            // 기타 에러 처리
            Alert.alert('오류가 발생했습니다', error.message);
        }
        return Promise.reject(error);
    }
);

// API 엔드포인트들
const authAPI = {
    // 아이디/비밀번호 찾기
    verifyAuthCode: (data) => api.post('/auth/verify-code', data),
    findId: (data) => api.post('/auth/find/id', data),

    // 일반 로그인
    login: (credentials) => api.post('/auth/login', credentials),

    // 소셜 로그인
    googleLogin: (token) => api.post('/auth/google', {token}),
    kakaoLogin: (token) => api.post('/auth/kakao', {token}),
    naverLogin: (token) => api.post('/auth/naver', {token}),

    // 토큰 검증
    verifyToken: () => api.get('/auth/verify'),

    // 로그아웃
    logout: () => api.post('/auth/logout'),

    // 비밀번호 재설정
    resetPassword: (data) => api.post('/auth/reset-password', data),
    updatePassword: (data) => api.put('/auth/password', data),

    // 회원가입
    register: (userData) => api.post('/auth/register', {userData}),
    checkUsername: (data) => api.post('/auth/check-username', data),
    sendAuthCode: (data) => api.post('/auth/send-code', data),

    // 유효성 검증
    validateUsername: (username) => api.post('/auth/validate/username', {username}),
    validateEmail: (email) => api.post('/auth/validate/email', {email}),
    validatePassword: (password) => api.post('/auth/validate/password', {password}),
};

const userAPI = {
    // 프로필 관리
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),

    // 이미지 업로드
    uploadImage: (type, formData) => api.post(`/user/images/${type}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),

    // 프로필 설정
    updateProfileSettings: (settings) => api.put('/user/profile/settings', settings),
    deleteProfileImage: (type) => api.delete(`/user/images/${type}`),

    // 프라이버시 설정
    updatePrivacy: (settings) => api.put('/user/privacy', settings),

    // 계정 연동
    getConnectedAccounts: () => api.get('/user/connected-accounts'),
    connectAccounts: (provider, token) => api.post('/user/connected-account', {provider, token}),
    disconnectAccount: (accountId) => api.delete(`/user/connected-accounts/${accountId}`),

    // 소셜 계정 관리
    getSocialAccounts: () => api.get('/user/social-accounts'),
    disconnectedSocialAccount: (accountId) => api.delete(`/user/social-accounts/${accountId}`),

    // 소셜 연동
    connectSocialAccount: (provider, token) => api.post('/user/social-accounts', {provider, token}),
    validateSocialAccount: (provider, email) => api.post('/user/social-accounts/validate', {provider, email}),
};

const studyAPI = {
    // 대시보드 데이터
    getDashboardData: () => api.get('/study/dashboard'),

    // 학습 세션
    startStudySession: () => api.post('/study/sessions/start'),
    endStudySession: (sessionId) => api.put(`/study/sessions/${sessionId}/end`),
    pauseStudySession: (sessionId) => api.put(`/study/sessions/${sessionId}/pause`),

    // 학습 통계
    getWeeklyStats: () => api.get('/study/stats/weekly'),
    getStudyStreak: () => api.get('/study/streak'),
    getStudyStats: (params) => api.get('/study/stats', {params}),
    getAchievementRate: () => api.get('/study/achievement/rate'),

    // 학습 진행도
    getMonthlyProgress: () => api.get('/study/progress/monthly'),
    getWeeklyProgress: () => api.get('/study/progress/weekly'),

    // 추천 콘텐츠
    getRecommendations: () => api.get('/study/recommendations'),

    // 학습 분석 데이터
    getAnalytics: (timeRange) => api.get(`/study/analytics/${timeRange}`),
    getSubjectAnalytics: (subjectId, timeRange) => api.get(`/study/analytics/subjects/${subjectId}?timeRange=${timeRange}`),

    // 통계 데이터
    getTodayStats: () => api.get('/study/stats/today'),
    getWeeklyToday: () => api.get('/study/stats/weekly'),
    getGrowthRate: () => api.get('/study/stats/growth'),

    // 레벨 및 스트릭
    getLevelInfo: () => api.get('/study/level'),
    getStreakInfo: () => api.get('/study/streak'),

    // 목표 및 일정
    getStudySchedule: () => api.get('/study/schedule'),
    getStudyGoals: () => api.get('/study/goals'),
    updateGoalStatus: (goalId, completed) => api.put(`/study/goals/${goalId}`, {completed})
};

const mentorAPI = {
    // 멘토 목록 및 검색
    getMentors: () => api.get('/mentors'),
    searchMentors: (query) => api.get(`/mentors/search?q=${query}`),
    getMentorDetail: (mentorId) => api.get(`/mentors/${mentorId}`),

    // 멘토 신청
    applyMentor: () => api.post('/mentors/apply'),
    updateMentorProfile: (data) => api.put('/mentors/profile', data),

    // 멘토링 매칭
    requestMatch: (mentorId) => api.post(`/mentors/${mentorId}/match`),
    getMatchRequests: () => api.get('/mentors/match-requests'),
    respondToMatch: (requestId, status) => api.put(`/mentors/match-requests/${requestId}`, status),

    // 멘토링 세션
    getMentoringSessions: () => api.get('/mentors/sessions'),
    createMentoringSession: (data) => api.post('/mentors/sessions', data),
}

const groupAPI = {
    // 그룹 활동
    getGroupActivities: (groupId) => api.get(`/groups/${groupId}/activities`),
    getActivityDetail: (groupId, activityId) => api.get(`/groups/${groupId}/activities/${activityId}`),
    createActivity: (groupId, data) => api.post(`/groups/${groupId}/activities`, data),
    deleteActivity: (groupId, activityId) => api.delete(`/groups/${groupId}/activities/${activityId}`),

    // 그룹 생성
    createGroup: (formData) => api.post('/groups', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),

    // 그룹 유효성 검증
    validateGroupName: (name) => api.post('/groups/validate/name', {name}),
    validateGroupSettings: (settings) => api.post('/groups/validate/settings', settings),

    // 그룹 설정
    updateGroupSettings: (groupId, settings) => api.put(`/groups/${groupId}/settings`, settings),
    updateGroupCover: (groupId, image) => {
        const formData = new FormData();
        formData.append('coverImage', image);
        return api.put(`/groups/${groupId}/cover`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getGroupSettings: (groupId) => api.get(`/groups/${groupId}/settings`),

    // 그룹 상세 정보
    getGroupDetails: (groupId) => api.get(`/groups/${groupId}`),

    // 피드 관리
    getFeedList: (groupId) => api.get(`/groups/${groupId}/feeds`),
    handleFeedAction: (groupId, feedId, actionType) => api.post(`/groups/${groupId}/feeds/${feedId}/${actionType}`),
    createFeed: (groupId, data) => api.post(`/groups/${groupId}/feeds`, data),
    deleteFeed: (groupId, feedId) => api.delete(`/groups/${groupId}/feeds/${feedId}`),

    // 멤버 관리
    getGroupMembers: (groupId) => api.get(`/groups/${groupId}/members`),
    updateMemberRole: (groupId, memberId, role) => api.put(`/groups/${groupId}/members/${memberId}/role`, {role}),
    removeMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
    getMemberRequests: (groupId) => api.get(`/groups/${groupId}/requests`),
    handleMemberRequest: (groupId, userId, action) => api.post(`/groups/${groupId}/requests/${userId}/${action}`),

    // 멤버 역할 관리
    getMemberRoles: (groupId) => api.get(`/groups/${groupId}/roles`),

    // 멤버 요청 상세
    getMemberRequestDetail: (groupId, requestId) => api.get(`/groups/${groupId}/requests/${requestId}`),
    cancelMemberRequest: (groupId, requestId) => api.delete(`/groups/${groupId}/requests/${requestId}`),

    // 그룹 목록
    getGroups: () => api.get('/groups'),
    getRecentGroups: () => api.get('/groups/recent'),
    searchGroups: (query) => api.get(`/groups/search?q=${query}`),

    // 그룹 필터링
    getGroupsByCategory: (category) => api.get(`/groups/category/${category}`),
    getGroupsByTags: (tags) => api.get('/groups/tags', {params: {tags}}),

    // 그룹 통계
    getGroupStats: (groupId) => api.get(`/groups/${groupId}/stats`),
    getWeeklyEvents: (groupId) => api.get(`/groups/${groupId}/events/weeklyEvents`),

    // 이미지 업로드
    uploadGroupImage: (groupId, imageData) => {
        const formData = new FormData();
        formData.append('type', imageData.type);
        formData.append('image', {
            uri: imageData.uri,
            type: 'image/jpeg',
            name: 'image.jpg'
        });
        return api.post(`/groups/${groupId}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // 그룹 규칙 관리
    updateGroupRules: (groupId, rules) => api.put(`/groups/${groupId}/rules`, {rules}),

    // 그룹 목표 관리
    updateGroupGoals: (groupId, goals) => api.put(`/groups/${groupId}/goals/`, {goals}),

    // 멤버 활동 관리
    getMemberActivities: (groupId) => api.get(`/groups/${groupId}/member-activities`),
    getMemberActivityDetail: (groupId, activityId) => api.get(`/groups/${groupId}/member-activities/${activityId}`),
    createMemberActivity: (groupId, data) => api.post(`/groups/${groupId}/member-activities`, data),
    deleteMemberActivity: (groupId, activityId) => api.delete(`/groups/${groupId}/member-activities/${activityId}`),

    // 멤버 초대
    getAvailableMembers: (groupId) => api.get(`/groups/${groupId}/available-members`),
    inviteMembers: (groupId, memberIds) => api.post(`/groups/${groupId}/invite`, {memberIds}),

    // 초대 관리
    getInvitations: (groupId) => api.get(`/groups/${groupId}/invitations`),
    cancelInvitation: (groupId, invitationId) => api.delete(`/groups/${groupId}/invitations/${invitationId}`),

    // 역할 권한 관리
    getRoles: (groupId) => api.get(`/groups/${groupId}/roles`),
    updateRolePermissions: (groupId, roleId, permissions) => api.post(`/groups/${groupId}/roles/${roleId}`, {permissions}),

    // 내 그룹
    getMyGroups: () => api.get('/groups/my'),

    // 초대 관련
    createInvitation: (groupId) => api.post(`/groups/${groupId}/invitations`),
    getInvitationCode: (groupId) => api.get(`/groups/${groupId}/invitation-code`),
};

const storageAPI = {
    // 저장소 타입 관리
    changeStorageType: () => api.post('/storage/type', {type}),
    getCurrentStorage: () => api.get('/storage/type'),

    // 데이터 마이그레이션
    migrateData: (fromType, toType) => api.post('/storage/migrate', {
        fromType,
        toType
    }),

    // 저장소 상태
    getStorageStatus: () => api.get('/storage/status'),
    validateStorage: (type) => api.post('/storage/validate', {type}),
}

const backupAPI = {
    // 백업 설정 관리
    getSettings: () => api.get('/backup/settings'),
    updateSettings: (settings) => api.put('/backup/settings', settings),

    // 백업 및 복원
    createBackup: () => api.post('/backup'),
    restore: () => api.post('/backup/restore'),

    // 백업 정보
    getBackupInfo: () => api.get('/backup/info'),
    getBackupHistory: () => api.get('/backup/history'),
    deleteBackup: (backupId) => api.delete(`/backup/${backupId}`),
}

const sessionAPI = {
    // 세션 관리
    startSession: () => api.post('/sessions/start'),
    endSession: (data) => api.post(`/sessions/end`, data),
    updateCycles: (cycles) => api.put('/sessions/cycles', {cycles}),

    // 세션 노트
    saveNotes: (notes) => api.post('/sessions/notes', {notes}),
    getNotes: () => api.get('/sessions/notes'),

    // 세션 설정
    updateSessionSettings: (settings) => api.put('/sessions/settings', settings),
    getSessionSettings: () => api.get('/sessions/settings'),
}

const goalAPI = {
    // 목표 생성 및 관리
    createGoal: (data) => api.post('/goals', data),
    updateGoal: (goalId, data) => api.put(`/goals/${goalId}`, data),
    deleteGoal: (goalId) => api.delete(`/goals/${goalId}`),

    // 목표 조회
    getGoals: () => api.get(`/goals`),
    getGoalDetail: (goalId) => api.get(`/goals/${goalId}`),
    getGoalsByCategory: (category) => api.get(`/goals/category/${category}`),

    // 목표 진행도
    updateGoalProgress: (goalId, progress) => api.put(`/goals/${goalId}/progress`, {progress}),
    getGoalProgress: (goalId) => api.get(`/goals/${goalId}/progress`),

    // 목표 상태 관리
    getGoalStats: (goalId) => api.get(`/goals/${goalId}/stats`),

};

const feedbackAPI = {
    // 피드백 조회
    getFeedback: () => api.get('/feedback'),

    // 자기 평가
    saveSelfEvaluation: (data) => api.post('/feedback/self-evaluation', data),
    getSelfEvaluationHistory: () => api.get('/feedback/self-evaluation/history'),

    // 학습 일지
    saveJournal: (data) => api.post('/feedback/journal', data),
    getJournalHistory: () => api.get('/feedback/journal/history'),
    updateJournal: (journalId, data) => api.put(`/feedback/journal/${journalId}`, data),
}

const settingsAPI = {
    // 화면 모드 관리
    updateDisplayMode: (mode) => api.put('/settings/display-mode', {mode}),
    getDisplayMode: () => api.get('/settings/display-mode'),

    // 테마 설정
    getThemeSettings: () => api.get('/settings/theme'),
    updateThemeSettings: (settings) => api.put('/settings/theme', settings),

    // 시스템 설정 동기화
    syncWithSystem: (enabled) => api.put('/settings/sync', {enabled}),
    getSystemSync: () => api.get('/settings/sync'),

    // 글자 크기 관리
    updateFontSize: (size) => api.put('/settings/font-size', {size}),
    getFontSize: () => api.get('/settings/font-size'),

    // 글자 설정
    getFontSettings: () => api.get('/settings/font'),
    updateFontSettings: (settings) => api.put('/settings/font', settings),

    // 기본값 관리
    resetFontSize: () => api.post('/settings/font-size/reset'),

    // 언어 설정 관리
    updateLanguage: (language) => api.put('/settings/language', {language}),
    getLanguage: () => api.get('/settings/language'),

    // 다국어 지원
    getAvailableLanguages: () => api.get('/settings/languages'),
    getTranslations: (language) => api.get(`/settings/translations/${language}`),

    // 언어 설정 동기화
    syncLanguage: (deviceLanguage) => api.post('/settings/language/sync', {deviceLanguage}),
    validateLanguage: (language) => api.post('/settings/language/validate', {language}),

    // 알림 설정 관리
    getNotificationSettings: (type) => api.get(`/settings/notifications/${type}`),
    updateNotificationSettings: (type, settings) => api.put(`/settings/notifications/${type}`, settings),
    getSettingsByType: (type) => api.get(`/settings/notifications/types/${type}`),

    // 알림 채널 관리
    getNotificationChannels: () => api.get('/settings/notifications/channels'),
    updateNotificationChannel: (channel, settings) => api.put(`/settings/notifications/channels/${channel}`, settings),

    // 알림 테스트
    testNotification: (type) => api.post(`/settings/notifications/${type}/test`),

    // 알림 일정 관리
    updateSchedule: (type, schedule) => api.put(`/settings/notifications/schedule/${type}`, schedule),
    getSchedule: () => api.get('/settings/notifications/schedule'),

    // 공개 범위 설정
    getPrivacySettings: () => api.get('/settings/privacy'),
    updatePrivacySettings: (settings) => api.put('/settings/privacy', settings),

    // 계정 공개 범위 관리
    getBlockedUsers: () => api.get('/settings/privacy/blocked'),
    updateBlockedUsers: (users) => api.put('/settings/privacy/blocked', {users}),

    // 프로필 접근 권한
    getProfileAccess: () => api.get('/settings/privacy/access'),
    updateProfileAccess: (settings) => api.put('/settings/privacy/access', settings),

    // 백업 설정 관리
    getBackupSettings: () => api.get('/settings/backup'),
    updateAutoBackup: (enabled) => api.put('/settings/backup/auto', {enabled}),

    // 백업 및 복원
    backupSettings: () => api.post('/settings/backup'),
    restoreSettings: () => api.post('/settings/backup/restore'),

    // 백업 정보
    getBackupInfo: () => api.get('/settings/backup/info'),
    deleteBackup: (backupId) => api.delete(`/settings/backup/${backupId}`),

    // 기본 설정 관리
    getSettings: () => api.get('/settings'),
    updateSettings: (settings) => api.put('/settings', settings),

    // 계정 관리
    logout: () => api.post('/auth/logout'),
    deleteAccount: () => api.delete('/settings/account'),

    // 설정 동기화
    syncSettings: () => api.post('/settings/sync'),
    validateSettings: () => api.post('/settings/validate'),

    // 시간 설정 관리
    getTimeSettings: (type) => api.get(`/settings/time/${type}`),
    updateTimeSettings: (type, settings) => api.put(`/settings/time/${type}`, settings),

    // 알림 시간대 관리
    getNotificationPeriods: () => api.get('/settings/time/periods'),
    validateTimeSettings: (settings) => api.post('/settings/time/validate', settings)
}

const materialAPI = {
    // 학습 자료 조회 및 관리
    getMaterialDetail: (materialId) => api.get(`/materials/${materialId}`),
    updateMaterial: (materialId, data) => api.put(`/materials/${materialId}`, data),
    deleteMaterial: (materialId) => api.delete(`/materials/${materialId}`),

    // 자료 공유
    shareMaterial: (materialId, users) => api.post(`/materials/${materialId}/share`, {users}),
    getSharedMaterials: () => api.get('/materials/shared'),

    // 태그 관리
    getMaterialsByTag: (tag) => api.get(`/materials/tags/${tag}`),
    updateMaterialTags: (materialId, tags) => api.put(`/materials/${materialId}/tags`, {tags})
}

const friendsAPI = {
    // 친구 목록
    getFriends: () => api.get('/friends'),
    getFriendRequests: () => api.get('/friends/requests'),

    // 친구 관리
    addFriend: (userId) => api.post('/friends/add', {userId}),
    acceptRequest: (requestId) => api.post(`/friends/requests/${requestId}/accept`),
    rejectRequest: (requestId) => api.post(`/friends/requests/${requestId}/reject`),
    removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
    toggleBlock: (friendId) => api.put(`/friends/${friendId}/block`),
    toggleHide: (friendId) => api.put(`/friends/${friendId}/hide`),

    // 친구 설정
    updateFriendSettings: (settings) => api.put('/friends/settings', {settings}),
    blockUser: (userId) => api.post('/friends/block', {userId}),
    unblockUser: (userId) => api.delete(`/friends/unblock/${userId}`),

    // 친구 검색
    searchFriends: (query) => api.get(`/friends/search?q=${query}`),

    // 친구 프로필
    getFriendProfile: (friendId) => api.get(`/friends/${friendId}/profile`),
    updateFriendNickname: (friendId) => api.update(`/friends/${friendId}/nickname`, {nickname}),

    // 채팅
    startChat: (friendId) => api.post('/chat/direct', {friendId}),

    getCommonGroups: (friendId) => api.get(`/friends/${friendId}/common-groups`),
}

const scheduleAPI = {
    // 일정 조회 및 관리
    getSchedules: (date) => api.get(`/schedules?date=${date}`),
    createSchedule: (data) => api.post('/schedules', data),
    updateSchedule: (scheduled, data) => api.put(`/schedules/${scheduleId}`, data),
    deleteSchedule: (scheduleId) => api.delete(`/schedules/${scheduleId}`),

    // 일정 설정
    updateScheduleSettings: (scheduleId, settings) => api.put(`/schedules/${scheduleId}/settings`, settings),
    getScheduleSettings: () => api.get('/schedules/settings'),
}

const communityAPI = {
    // 질문
    createQuestion: (data) => api.post('/community/questions', data),
    updateQuestion: (questionId, data) => api.put(`/community/questions/${questionId}`, data),
    deleteQuestion: (questionId) => api.delete(`/community/questions/${questionId}`),
    validateQuestion: (data) => api.post('/community/questions/validate', data),

    // 질문 상세
    getQuestionDetail: (questionId) => api.post(`/community/questions/${questionId}`),

    // 답변
    createAnswer: (questionId, content) => api.post(`/community/questions/${questionId}/answers`, {content}),
    updateAnswer: (answerId, content) => api.put(`/community/answers/${answerId}`, {content}),
    deleteAnswer: (answerId) => api.delete(`/community/answers/${answerId}`),
}

const notificationAPI = {
    // 알림 목록
    getNotifications: () => api.get('/notifications'),
    putMarkAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
    putMarkAllAsRead: () => api.put('/notifications/read-all'),

    // 알림 설정
    getNotificationSettings: () => api.get('/notifications/settings'),
    updateNotificationSettings: (settings) => api.put('notifications/settings', settings),

    // 알림 관리
    deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
    clearAllNotifications: () => api.delete('/notifications/clear-all'),

}

const chatAPI = {
    // 채팅 목록 및 알림 관리
    getUnreadCount: () => api.get('/chat/unread-count'),
    getChatList: () => api.get('/chat/list'),

    // 새 채팅방 생성
    createNewChat: (userIds) => api.post('/chat/rooms', {userIds}),
    searchUsers: (query) => api.get(`/chat/users/search?q=${query}`),

    // 친구 관련
    getFriends: (params) => api.get('/friends/list', {params}),
    getFriendRequests: () => api.get('/friends/requests'),
    addFriend: (userId) => api.post('/friends/add', {userId}),
    acceptFriendRequest: (requestId) => api.put(`/friends/requests/${requestId}/accept`),
    rejectFriendRequest: (requestId) => api.put(`/friends/requests/${requestId}/reject`),

    // 채팅방 목록 관련
    getChatRooms: () => api.get('/chat/rooms'),
    pinChatRoom: (roomId, isPinned) => api.put(`/chat/rooms/${roomId}/pin`, {isPinned}),

    // 채팅방 검색
    searchChatRooms: (query) => api.get(`/chat/rooms/search?q=${query}`),

    // 읽음 처리
    markAsRead: (roomId) => api.put(`/chat/rooms/${roomId}/read`),
    markAllAsRead: () => api.put('/chat/mark-all-read'),

    // 채팅방 메타데이터
    getRoomMetadata: (roomId) => api.get(`/chat/rooms/${roomId}/metadata`),

    // 메시지 관리
    getMessages: (roomId) => api.get(`/chat/rooms/${roomId}/messages`),
    sendMessage: (roomId, message) => api.post(`/chat/rooms/${roomId}/messages`, {message}),
    deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
    deleteChat: (chatId) => api.delete(`/chat/messages/${chatId}`),
    togglePin: (messageId) => api.put(`/chat/messages/${messageId}/pin`),
    replyToMessage: (messageId, message) => api.post(`/chat/messages/${messageId}/reply`, {message}),

    // 메시지 검색
    searchMessages: (roomId, query) => api.get(`/chat/rooms/${roomId}/messages/search?q=${query}`),

    // 첨부파일
    uploadFile: (roomId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/chat/rooms/${roomId}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    uploadImage: (roomId, image) => {
        const formData = new FormData();
        formData.append('image, image');
        return api.post(`/chat/rooms/${roomId}/images`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // 채팅방 설정
    getRoomDetail: (roomId) => api.get(`/chat/rooms/${roomId}/detail`),
    updateRoomSettings: (roomId, settings) => api.put(`/chat/rooms/${roomId}/settings`, settings),
    deleteRoom: (roomId) => api.delete(`/chat/rooms/${roomId}`),

    // 참여자 관리
    getParticipants: (roomId) => api.get(`/chat/rooms/${roomId}/participants`),
    addParticipant: (roomId, userId) => api.post(`/chat/rooms/${roomId}/participants`, {userId}),
    removeParticipant: (roomId, userId) => api.delete(`/chat/rooms/${roomId}/participants/${userId}`),
};

export {
    api as default,
    authAPI,
    userAPI,
    studyAPI,
    groupAPI,
    chatAPI,
    communityAPI,
    friendsAPI,
    mentorAPI,
    notificationAPI,
    goalAPI,
    scheduleAPI,
    feedbackAPI,
    materialAPI,
    sessionAPI,
    backupAPI,
    storageAPI,
    settingsAPI,
};
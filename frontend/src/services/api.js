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
    register: (userData) => api.post('/auth/register', userData),
    checkUsername: (data) => api.post('/auth/check-username', data),
    sendAuthCode: (data) => api.post('/auth/send-code', data),

    // 유효성 검증
    validateUsername: (username) => api.post('/auth/validate/username', {username}),
    validateEmail: (email) => api.post('/auth/validate/email', {email}),
    validatePassword: (password) => api.post('/auth/validate/password', {password}),
};

const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (userData) => api.put('/user/profile', userData),
    updatePassword: (passwords) => api.put('/user/password', passwords),
};

const studyAPI = {
    getDashboard: () => api.get('/study/dashboard'),
    getStatistics: () => api.get('/study/statistics'),
    updateGoals: (goals) => api.put('/study/goals', goals),
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
};
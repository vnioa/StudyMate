import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {EventEmitter} from "expo";
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://192.168.169.130:3000';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    // 재시도 설정
    retry: 3,
    retryDelay: 1000,
});

// 요청 인터셉터
api.interceptors.request.use(
    async (config) => {
        try {
            // 네트워크 연결 상태 확인
            const networkState = await NetInfo.fetch();
            if (!networkState.isConnected) {
                return Promise.reject({
                    success: false,
                    message: '인터넷 연결을 확인해주세요.',
                    status: 'NETWORK_ERROR'
                });
            }

            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        } catch (error) {
            return Promise.reject({
                success: false,
                message: '네트워크 요청 중 오류가 발생했습니다.',
                status: 'REQUEST_ERROR',
                error
            });
        }
    },
    (error) => {
        return Promise.reject({
            success: false,
            message: '요청 처리 중 오류가 발생했습니다.',
            status: 'INTERCEPTOR_ERROR',
            error
        });
    }
);

// 응답 인터셉터 개선
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
                // 401 에러 발생 시 이벤트 발생
                EventEmitter.emit('unauthorized');
                return Promise.reject(error);
            } catch (asyncError) {
                return Promise.reject(asyncError);
            }
        }

        // 타임아웃 에러 처리
        if (error.code === 'ECONNABORTED') {
            return Promise.reject({
                success: false,
                message: '요청 시간이 초과되었습니다.',
                status: 408
            });
        }

        return Promise.reject({
            success: false,
            message: error.response?.data?.message || '서버와의 통신 중 오류가 발생했습니다.',
            status: error.response?.status || 500,
            data: error.response?.data
        });
    }
);

// 재시도 로직 구현
api.interceptors.response.use(undefined, async (err) => {
    const { config } = err;
    if (!config || !config.retry) return Promise.reject(err);

    config._retryCount = config._retryCount || 0;

    if (config._retryCount >= config.retry) {
        return Promise.reject(err);
    }

    config._retryCount += 1;

    const backoff = new Promise((resolve) => {
        setTimeout(() => resolve(), config.retryDelay || 1000);
    });

    await backoff;
    return api(config);
});

export const authAPI = {
    // 인증 코드 발송
    // @param data: {name: string, email: string, type: 'id' | 'password', userId?: string}
    // @returns: {success: boolean}
    sendAuthCode: async (data) => {
        const response = await api.post('/auth/send-code', data);
        return response.data;
    },

    // 인증 코드 확인
    // @param data: {email: string, authCode: string, type: 'id' | 'password'}
    // @returns: {success: boolean, userId?: string}
    verifyAuthCode: async (data) => {
        const response = await api.post('/auth/verify-code', data);
        return response.data;
    },

    // 로그인
    // @param data: {userId: string, password: string}
    // @returns: {accessToken: string, refreshToken: string, user: UserType}
    login: async (data) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    // 로그아웃
    // @returns: {success: boolean}
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    // 비밀번호 재설정
    // @param data: {email: string, userId: string, newPassword: string}
    // @returns: {success: boolean}
    resetPassword: async (data) => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },

    // 구글 로그인
    // @param data: {accessToken: string, userInfo: {id: string, email: string, name: string, profileImage: string}}
    // @returns: {success: boolean, data: {token: string, refreshToken: string, user: UserType}}
    googleLogin: async (data) => {
        const response = await api.post('/auth/google', data);
        return response.data;
    },

    // 카카오 로그인
    // @param data: {accessToken: string, userInfo: {id: string, email: string, name: string, profileImage: string}}
    // @returns: {success: boolean, data: {token: string, refreshToken: string, user: UserType}}
    kakaoLogin: async (data) => {
        const response = await api.post('/auth/kakao', data);
        return response.data;
    },

    // 로그인 상태 확인
    // @returns: {success: boolean}
    checkLoginStatus: async () => {
        const response = await api.get('/auth/status');
        return response.data;
    },

    // 토큰 갱신
    // @param data: {refreshToken: string}
    // @returns: {accessToken: string}
    refresh: async (data) => {
        const response = await api.post('/auth/refresh', data);
        return response.data;
    },

    // 회원가입
    // @param data: {username: string, password: string, name: string, birthdate: string, phoneNumber: string, email: string}
    // @returns: {success: boolean, data: {token: string, refreshToken: string, user: UserType}}
    register: async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    // 아이디 중복 확인
    // @param username: string
    // @returns: {available: boolean}
    checkUsername: async (username) => {
        const response = await api.get(`/auth/check-username/${username}`);
        return response.data;
    },
};

export const chatAPI = {
    // 읽지 않은 메시지 수 조회
    // @returns: {unreadCount: number}
    getUnreadCount: async () => {
        const response = await api.get('/chat/unread-count');
        return response.data;
    },

    // 채팅방 생성
    // @param data: {type: 'individual' | 'group', participants?: string[]}
    // @returns: {roomId: string}
    createChatRoom: async (data) => {
        const response = await api.post('/chat/rooms', data);
        return response.data;
    },

    // 채팅방 목록 조회
    // @param params: {page?: number, limit?: number}
    // @returns: {rooms: ChatRoom[], totalCount: number}
    getChatRooms: async (params) => {
        const response = await api.get('/chat/rooms', { params });
        return response.data;
    },

    // 채팅방 상세 조회
    // @param roomId: string
    // @returns: {room: ChatRoom, messages: ChatMessage[]}
    getChatRoom: async (roomId) => {
        const response = await api.get(`/chat/rooms/${roomId}`);
        return response.data;
    },

    // 메시지 전송
    // @param roomId: string
    // @param data: {content: string, type: 'text' | 'image' | 'file'}
    // @returns: {messageId: string, sentAt: Date}
    sendMessage: async (roomId, data) => {
        const response = await api.post(`/chat/rooms/${roomId}/messages`, data);
        return response.data;
    },

    // 메시지 읽음 처리
    // @param roomId: string
    // @param messageId: string
    // @returns: {success: boolean}
    markAsRead: async (roomId, messageId) => {
        const response = await api.put(`/chat/rooms/${roomId}/messages/${messageId}/read`);
        return response.data;
    },

    // 채팅방 나가기
    // @param roomId: string
    // @returns: {success: boolean}
    leaveRoom: async (roomId) => {
        const response = await api.delete(`/chat/rooms/${roomId}/leave`);
        return response.data;
    },

    // 채팅방 검색
    // @param query: string
    // @returns: {rooms: ChatRoom[]}
    searchRooms: async (query) => {
        const response = await api.get(`/chat/rooms/search?query=${query}`);
        return response.data;
    },

    // 채팅방 고정/고정해제
    // @param roomId: string
    // @param isPinned: boolean
    // @returns: {success: boolean}
    pinChatRoom: async (roomId, isPinned) => {
        const response = await api.put(`/chat/rooms/${roomId}/pin`, { isPinned });
        return response.data;
    },

    // 채팅방 삭제
    // @param roomId: string
    // @returns: {success: boolean}
    deleteRoom: async (roomId) => {
        const response = await api.delete(`/chat/rooms/${roomId}`);
        return response.data;
    },

    // 채팅방 정보 조회
    // @param roomId: string
    // @returns: {roomInfo: RoomInfo}
    getRoomInfo: async (roomId) => {
        const response = await api.get(`/chat/rooms/${roomId}`);
        return response.data;
    },

    // 이미지 메시지 전송
    // @param roomId: string
    // @param formData: FormData
    // @returns: {message: Message}
    sendImageMessage: async (roomId, formData) => {
        const response = await api.post(`/chat/rooms/${roomId}/messages/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // 채팅방 설정 업데이트
    // @param roomId: string
    // @param data: {notification?: boolean, encryption?: boolean, theme?: string, roomName?: string}
    // @returns: {success: boolean}
    updateRoomSettings: async (roomId, data) => {
        const response = await api.put(`/chat/rooms/${roomId}/settings`, data);
        return response.data;
    },

    // 채팅방 이름 변경
    // @param roomId: string
    // @param data: {roomName: string}
    // @returns: {success: boolean}
    updateRoomName: async (roomId, data) => {
        const response = await api.put(`/chat/rooms/${roomId}/name`, data);
        return response.data;
    },

    // 채팅방 참여자 관리
    // @param roomId: string
    // @param data: {participants: string[]}
    // @returns: {success: boolean}
    updateParticipants: async (roomId, data) => {
        const response = await api.put(`/chat/rooms/${roomId}/participants`, data);
        return response.data;
    },

    // 메시지 중요 표시 토글
    // @param messageId: string
    // @returns: {success: boolean, isImportant: boolean}
    toggleImportant: async (messageId) => {
        const response = await api.put(`/chat/messages/${messageId}/important`);
        return response.data;
    },

    // 채팅방 상세 정보 조회
    // @param roomId: string
    // @returns: {roomInfo: {notification: boolean, encryption: boolean, theme: string, roomName: string, participants: User[]}}
    getRoomDetail: async (roomId) => {
        const response = await api.get(`/chat/rooms/${roomId}/settings`);
        return response.data;
    },
};

export const backupAPI = {
    // 마지막 백업 정보 조회
    // @returns: {lastBackup: {date: string} | null}
    getLastBackup: async () => {
        const response = await api.get('/backup/last');
        return response.data;
    },

    // 백업 상태 조회
    // @returns: {completed: boolean, progress?: number}
    getBackupStatus: async () => {
        const response = await api.get('/backup/status');
        return response.data;
    },

    // 새로운 백업 생성
    // @returns: {success: boolean, backupId: string}
    createBackup: async () => {
        const response = await api.post('/backup/create');
        return response.data;
    },

    // 백업 복원
    // @returns: {success: boolean}
    restoreFromBackup: async () => {
        const response = await api.post('/backup/restore');
        return response.data;
    },

    // 백업 설정 조회
    // @returns: {isAutoBackup: boolean, lastBackupDate: Date, backupSize: number, backupInterval: string, backupHistory: BackupHistory[]}
    getSettings: async () => {
        const response = await api.get('/backup/settings');
        return response.data;
    },

    // 백업 설정 업데이트
    // @param data: {isAutoBackup: boolean, backupInterval: string}
    // @returns: {success: boolean}
    updateSettings: async (data) => {
        const response = await api.put('/backup/settings', data);
        return response.data;
    },
};

export const friendsAPI = {
    // 친구 목록 조회
    // @param params?: {group?: string, search?: string}
    // @returns: {friends: Friend[]}
    getFriends: async (params) => {
        const response = await api.get('/friends', { params });
        return response.data;
    },

    // 친구 검색
    // @param query: string
    // @returns: {friends: Friend[]}
    searchFriends: async (query) => {
        const response = await api.get(`/friends/search?query=${query}`);
        return response.data;
    },

    // 친구 그룹 목록 조회
    // @returns: {groups: string[]}
    getGroups: async () => {
        const response = await api.get('/friends/groups');
        return response.data;
    },

    // 친구 추가
    // @param friendId: string
    // @returns: {success: boolean}
    addFriend: async (friendId) => {
        const response = await api.post('/friends/add', { friendId });
        return response.data;
    },

    // 친구 삭제
    // @param friendId: string
    // @returns: {success: boolean}
    removeFriend: async (friendId) => {
        const response = await api.delete(`/friends/${friendId}`);
        return response.data;
    },

    // 친구 그룹 변경
    // @param friendId: string
    // @param group: string
    // @returns: {success: boolean}
    updateFriendGroup: async (friendId, group) => {
        const response = await api.put(`/friends/${friendId}/group`, { group });
        return response.data;
    },

    // 친구 요청 목록 조회
    // @returns: {requests: FriendRequest[]}
    getFriendRequests: async () => {
        const response = await api.get('/friends/requests');
        return response.data;
    },

    // 친구 요청 수락
    // @param requestId: string
    // @returns: {success: boolean}
    acceptFriendRequest: async (requestId) => {
        const response = await api.post(`/friends/requests/${requestId}/accept`);
        return response.data;
    },

    // 친구 요청 거절
    // @param requestId: string
    // @returns: {success: boolean}
    rejectFriendRequest: async (requestId) => {
        const response = await api.post(`/friends/requests/${requestId}/reject`);
        return response.data;
    },

    // 친구 요청 보내기
    // @param userId: string
    // @returns: {success: boolean}
    sendFriendRequest: async (userId) => {
        const response = await api.post('/friends/requests', { userId });
        return response.data;
    },

    // 친구 설정 조회
    // @returns: {settings: FriendSettings}
    getFriendSettings: async () => {
        const response = await api.get('/friends/settings');
        return response.data;
    },

    // 친구 설정 업데이트
    // @param settings: {allowFriendRequests?: boolean, showOnlineStatus?: boolean}
    // @returns: {success: boolean}
    updateFriendSettings: async (settings) => {
        const response = await api.put('/friends/settings', settings);
        return response.data;
    },

    // 친구 프로필 조회
    // @param friendId: string
    // @returns: {friend: Friend, isBlocked: boolean, isHidden: boolean, commonGroups: Group[]}
    getFriendProfile: async (friendId) => {
        const response = await api.get(`/friends/${friendId}/profile`);
        return response.data;
    },

    // 친구 차단/해제
    // @param friendId: string
    // @returns: {isBlocked: boolean}
    toggleBlock: async (friendId) => {
        const response = await api.put(`/friends/${friendId}/block`);
        return response.data;
    },

    // 친구 숨김/해제
    // @param friendId: string
    // @returns: {isHidden: boolean}
    toggleHide: async (friendId) => {
        const response = await api.put(`/friends/${friendId}/hide`);
        return response.data;
    },

    // 채팅방 시작
    // @param friendId: string
    // @returns: {roomId: string}
    startChat: async (friendId) => {
        const response = await api.post(`/chat/start`, { friendId });
        return response.data;
    },

    // 공통 그룹 조회
    // @param friendId: string
    // @returns: {groups: Group[]}
    getCommonGroups: async (friendId) => {
        const response = await api.get(`/friends/${friendId}/groups`);
        return response.data;
    }
};

export const profileAPI = {
    // 내 프로필 조회
    // @returns: {profile: Profile}
    getMyProfile: async () => {
        const response = await api.get('/profile');
        return response.data;
    },

    // 상태 메시지 업데이트
    // @param message: string
    // @returns: {success: boolean}
    updateStatus: async (message) => {
        const response = await api.put('/profile/status', { message });
        return response.data;
    }
};

export const communityAPI = {
    // 질문 유효성 검사
    // @param data: {title: string, content: string}
    // @returns: {success: boolean}
    validateQuestion: async (data) => {
        const response = await api.post('/community/questions/validate', data);
        return response.data;
    },

    // 질문 생성
    // @param data: {title: string, content: string}
    // @returns: {success: boolean, questionId: string}
    createQuestion: async (data) => {
        const response = await api.post('/community/questions', data);
        return response.data;
    },

    // 질문 목록 조회
    // @param params?: {page?: number, limit?: number, search?: string}
    // @returns: {questions: Question[], totalCount: number}
    getQuestions: async (params) => {
        const response = await api.get('/community/questions', { params });
        return response.data;
    },

    // 질문 상세 조회
    // @param questionId: string
    // @returns: {question: Question}
    getQuestion: async (questionId) => {
        const response = await api.get(`/community/questions/${questionId}`);
        return response.data;
    },

    // 질문 수정
    // @param questionId: string
    // @param data: {title?: string, content?: string}
    // @returns: {success: boolean, updatedAt: Date}
    updateQuestion: async (questionId, data) => {
        const response = await api.put(`/community/questions/${questionId}`, data);
        return response.data;
    },

    // 질문 삭제
    // @param questionId: string
    // @returns: {success: boolean}
    deleteQuestion: async (questionId) => {
        const response = await api.delete(`/community/questions/${questionId}`);
        return response.data;
    },

    // 답변 작성
    // @param questionId: string
    // @param data: {content: string}
    // @returns: {answer: Answer}
    createAnswer: async (questionId, data) => {
        const response = await api.post(`/community/questions/${questionId}/answers`, data);
        return response.data;
    },

    // 답변 삭제
    // @param answerId: string
    // @returns: {success: boolean}
    deleteAnswer: async (answerId) => {
        const response = await api.delete(`/community/answers/${answerId}`);
        return response.data;
    },

    // 답변 수정
    // @param answerId: string
    // @param data: {content: string}
    // @returns: {success: boolean}
    updateAnswer: async (answerId, data) => {
        const response = await api.put(`/community/answers/${answerId}`, data);
        return response.data;
    },

    // 커뮤니티 데이터 조회
    // @param tab: 'groups' | 'qna' | 'mentoring'
    // @returns: {items: Array<StudyGroup | Question | Mentor>}
    getData: async (tab) => {
        const response = await api.get(`/community/${tab}`);
        return response.data;
    },

    // 스터디 그룹 생성
    // @param data: {name: string, category: string, description: string}
    // @returns: {groupId: string}
    createStudyGroup: async (data) => {
        const response = await api.post('/community/groups', data);
        return response.data;
    },

    // 스터디 그룹 상세 조회
    // @param groupId: string
    // @returns: {group: StudyGroup}
    getStudyGroup: async (groupId) => {
        const response = await api.get(`/community/groups/${groupId}`);
        return response.data;
    },

    // 질문 상세 조회 중복
    // @param questionId: string
    // @returns: {question: Question, answers: Answer[]}
    getQuestionDetail: async (questionId) => {
        const response = await api.get(`/community/questions/${questionId}`);
        return response.data;
    },
};

export const groupAPI = {
    // 그룹 활동 내역 조회
    // @param groupId: string
    // @returns: {activities: Activity[]}
    getGroupActivities: async (groupId) => {
        const response = await api.get(`/groups/${groupId}/activities`);
        return response.data;
    },

    // 멘토링 정보 조회
    // @param groupId: string
    // @returns: {mentors: Mentor[], mentees: Mentee[]}
    getMentoringInfo: async (groupId) => {
        const response = await api.get(`/groups/${groupId}/mentoring`);
        return response.data;
    },

    // 멤버 활동 내역 조회
    // @param groupId: string
    // @returns: {activities: Activity[]}
    getMemberActivities: async (groupId) => {
        const response = await api.get(`/groups/${groupId}/member-activities`);
        return response.data;
    },

    // 그룹 상세 정보 조회
    // @param groupId: string
    // @returns: {group: Group}
    getGroupDetail: async (groupId) => {
        const response = await api.get(`/groups/${groupId}`);
        return response.data;
    },

    // 그룹 생성
    // @param data: FormData
    // @returns: {success: boolean, groupId: string}
    createGroup: async (data) => {
        const response = await api.post('/groups', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // 그룹 목록 조회
    // @returns: {groups: Group[]}
    getGroups: async () => {
        const response = await api.get('/groups');
        return response.data;
    },

    // 최근 활동 그룹 조회
    // @returns: {recentGroups: Group[]}
    getRecentGroups: async () => {
        const response = await api.get('/groups/recent');
        return response.data;
    },

    // 그룹 삭제
    // @param groupId: string
    // @returns: {success: boolean}
    deleteGroup: async (groupId) => {
        const response = await api.delete(`/groups/${groupId}`);
        return response.data;
    },

    // 그룹 정보 수정 updateGroupSettings랑 겹침
    // @param groupId: string
    // @param data: {name?: string, description?: string, image?: string}
    // @returns: {success: boolean}
    updateGroup: async (groupId, data) => {
        const response = await api.put(`/groups/${groupId}`, data);
        return response.data;
    },

    // 멤버 상세 정보 조회
    // @param groupId: string
    // @param memberId: string
    // @returns: {member: Member}
    getMemberDetail: async (groupId, memberId) => {
        const response = await api.get(`/groups/${groupId}/members/${memberId}`);
        return response.data;
    },

    // 그룹 멤버 목록 조회
    // @param groupId: string
    // @param params?: {search?: string, role?: string}
    // @returns: {members: Member[], totalCount: number}
    getGroupMembers: async (groupId, params) => {
        const response = await api.get(`/groups/${groupId}/members`, { params });
        return response.data;
    },

    // 가입 요청 목록 조회
    // @param groupId: string
    // @returns: {requests: JoinRequest[]}
    getJoinRequests: async (groupId) => {
        const response = await api.get(`/groups/${groupId}/join-requests`);
        return response.data;
    },

    // 가입 요청 처리
    // @param groupId: string
    // @param requestId: string
    // @param action: 'accept' | 'reject'
    // @returns: {success: boolean}
    handleJoinRequest: async (groupId, requestId, action) => {
        const response = await api.post(`/groups/${groupId}/join-requests/${requestId}/${action}`);
        return response.data;
    },

    // 초대 가능한 멤버 목록 조회
    // @param groupId: string
    // @returns: {members: Member[]}
    getAvailableMembers: async (groupId) => {
        const response = await api.get(`/groups/${groupId}/available-members`);
        return response.data;
    },

    // 사용자 검색
    // @param query: string
    // @returns: {users: User[]}
    searchUsers: async (query) => {
        const response = await api.get('/users/search', { params: { query } });
        return response.data;
    },

    // 멤버 가입 요청 일괄 처리
    // @param groupId: string
    // @param data: {requestIds: string[], action: 'accept' | 'reject'}
    // @returns: {success: boolean, processedCount: number}
    handleBulkMemberRequests: async (groupId, data) => {
        const response = await api.post(`/groups/${groupId}/requests/bulk`, data);
        return response.data;
    },

    // 멤버 가입 요청 상세 조회
    // @param groupId: string
    // @param requestId: string
    // @returns: {request: Request}
    getMemberRequestDetail: async (groupId, requestId) => {
        const response = await api.get(`/groups/${groupId}/requests/${requestId}`);
        return response.data;
    },

    // 그룹 멤버 추가
    // @param groupId: string
    // @param memberId: string
    // @returns: {success: boolean}
    addGroupMember: async (groupId, memberId) => {
        const response = await api.post(`/groups/${groupId}/members`, { memberId });
        return response.data;
    },

    // 멤버 초대
    // @param groupId: string
    // @param userIds: string[]
    // @returns: {success: boolean, invitedCount: number}
    inviteMembers: async (groupId, userIds) => {
        const response = await api.post(`/groups/${groupId}/invite`, { userIds });
        return response.data;
    },

    // 초대 코드 생성
    // @param groupId: string
    // @returns: {success: boolean, inviteCode: string}
    createInvitation: async (groupId) => {
        const response = await api.post(`/groups/${groupId}/invite-code`);
        return response.data;
    },

    // 멤버 강퇴
    // @param groupId: string
    // @param memberId: string
    // @returns: {success: boolean}
    removeMember: async (groupId, memberId) => {
        const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
        return response.data;
    },

    // 멤버 역할 변경
    // @param groupId: string
    // @param memberId: string
    // @param role: 'admin' | 'member'
    // @returns: {success: boolean}
    updateMemberRole: async (groupId, memberId, role) => {
        const response = await api.put(`/groups/${groupId}/members/${memberId}/role`, { role });
        return response.data;
    },

    // 그룹 설정 조회
    // @param groupId: string
    // @returns: {settings: GroupSettings}
    getGroupSettings: async (groupId) => {
        const response = await api.get(`/groups/${groupId}/settings`);
        return response.data;
    },

    // 그룹 설정 업데이트
    // @param groupId: string
    // @param data: {category?: string, memberLimit?: number}
    // @returns: {success: boolean}
    updateGroupSettings: async (groupId, data) => {
        const response = await api.put(`/groups/${groupId}/settings`, data);
        return response.data;
    },

    // 그룹 이미지 업로드
    // @param groupId: string
    // @param formData: FormData
    // @returns: {imageUrl: string}
    uploadGroupImage: async (groupId, formData) => {
        const response = await api.post(`/groups/${groupId}/image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // 그룹 가입
    // @param groupId: string
    // @returns: {success: boolean}
    joinGroup: async (groupId) => {
        const response = await api.post(`/groups/${groupId}/join`);
        return response.data;
    },

    // 그룹 탈퇴
    // 그룹 탈퇴
    // @param groupId: string
    // @returns: {success: boolean}
    leaveGroup: async (groupId) => {
        const response = await api.post(`/groups/${groupId}/leave`);
        return response.data;
    },

    // 멤버 검색
    // @param groupId: string
    // @param query: string
    // @returns: {members: Member[]}
    searchMembers: async (groupId, query) => {
        const response = await api.get(`/groups/${groupId}/members/search`, { params: { query } });
        return response.data;
    },


    // 피드 액션 처리
    // @param groupId: string
    // @param feedId: string
    // @param actionType: 'like' | 'comment' | 'share'
    // @returns: {success: boolean}
    handleFeedAction: async (groupId, feedId, actionType) => {
        const response = await api.post(`/groups/${groupId}/feeds/${feedId}/${actionType}`);
        return response.data;
    }
};

export const fileAPI = {
    // 파일 목록 조회
    // @returns: {files: File[]}
    getFiles: async () => {
        const response = await api.get('/files');
        return response.data;
    },

    // 파일 타입별 필터링
    // @param type: 'All' | 'PDF' | 'Image' | 'Video'
    // @returns: {files: File[]}
    filterFilesByType: async (type) => {
        const response = await api.get(`/files/filter/${type}`);
        return response.data;
    },

    // 파일 검색
    // @param query: string
    // @returns: {files: File[]}
    searchFiles: async (query) => {
        const response = await api.get('/files/search', { params: { query } });
        return response.data;
    },

    // 파일 공유 설정 업데이트
    // @param fileId: string
    // @param isShared: boolean
    // @returns: {success: boolean}
    updateFileSharing: async (fileId, isShared) => {
        const response = await api.put(`/files/${fileId}/share`, { isShared });
        return response.data;
    },

    // 파일 만료일 설정
    // @param fileId: string
    // @param expiryDate: string
    // @returns: {success: boolean}
    setFileExpiry: async (fileId, expiryDate) => {
        const response = await api.put(`/files/${fileId}/expiry`, { expiryDate });
        return response.data;
    },

    // 파일 미리보기
    // @param fileId: string
    // @returns: {preview: string}
    getFilePreview: async (fileId) => {
        const response = await api.get(`/files/${fileId}/preview`);
        return response.data;
    },

    // 파일 삭제
    // @param fileId: string
    // @returns: {success: boolean}
    deleteFile: async (fileId) => {
        const response = await api.delete(`/files/${fileId}`);
        return response.data;
    }
};

export const inviteAPI = {
    // 사용자 검색
    // @param query: string
    // @returns: {users: User[]}
    searchUsers: async (query) => {
        const response = await api.get('/invite/search', { params: { query } });
        return response.data;
    },

    // 초대장 발송
    // @param userIds: string[]
    // @returns: {success: boolean}
    sendInvitations: async (userIds) => {
        const response = await api.post('/invite/send', { userIds });
        return response.data;
    },

    // 초대 수락
    // @param inviteId: string
    // @returns: {success: boolean}
    acceptInvitation: async (inviteId) => {
        const response = await api.post(`/invite/${inviteId}/accept`);
        return response.data;
    },

    // 초대 거절
    // @param inviteId: string
    // @returns: {success: boolean}
    rejectInvitation: async (inviteId) => {
        const response = await api.post(`/invite/${inviteId}/reject`);
        return response.data;
    }
};

export const mentorAPI = {
    // 멘토 정보 유효성 검사
    // @param data: {name: string, field: string, career: string, introduction: string}
    // @returns: {success: boolean}
    validateMentorInfo: async (data) => {
        const response = await api.post('/mentors/validate', data);
        return response.data;
    },

    // 멘토 프로필 이미지 업로드
    // @param formData: FormData
    // @returns: {imageUrl: string}
    uploadMentorImage: async (formData) => {
        const response = await api.post('/mentors/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // 멘토 등록
    // @param data: {name: string, field: string, career: string, introduction: string, education?: string, skills?: string, availableTime?: string, profileImage?: string}
    // @returns: {success: boolean, mentorId: string}
    registerMentor: async (data) => {
        const response = await api.post('/mentors/register', data);
        return response.data;
    },

    // 멘토 정보 조회
    // @param mentorId: string
    // @returns: {mentor: Mentor}
    getMentorInfo: async (mentorId) => {
        const response = await api.get(`/mentors/${mentorId}`);
        return response.data;
    },

    // 멘토 정보 수정
    // @param mentorId: string
    // @param data: {field?: string, career?: string, introduction?: string, education?: string, skills?: string, availableTime?: string}
    // @returns: {success: boolean}
    updateMentorInfo: async (mentorId, data) => {
        const response = await api.put(`/mentors/${mentorId}`, data);
        return response.data;
    },
        // 멘토 등록
    // @param data: {field: string, experience: string, introduction: string}
    // @returns: {mentorId: string}
    // registerMentor: async (data) => {
    //     const response = await api.post('/community/mentors', data);
    //     return response.data;
    // },

    // 멘토 상세 조회
    // @param mentorId: string
    // @returns: {mentor: Mentor}
    // getMentorDetail: async (mentorId) => {
    //     const response = await api.get(`/community/mentors/${mentorId}`);
    //     return response.data;
    // },

    // 멘토링 채팅 시작
    // @param mentorId: string
    // @returns: {chatId: string}
    startMentorChat: async (mentorId) => {
        const response = await api.post(`/mentors/${mentorId}/chat`);
        return response.data;
    },
};

export const achievementAPI = {
    // 업적 목록 조회
    // @returns: {achievements: Achievement[], stats: {acquired: number, total: number}}
    getAchievements: async () => {
        const response = await api.get('/achievements');
        return response.data;
    },

    // 업적 상세 조회
    // @param achievementId: string
    // @returns: {achievement: Achievement}
    getAchievementDetail: async (achievementId) => {
        const response = await api.get(`/achievements/${achievementId}`);
        return response.data;
    },

    // 업적 진행도 업데이트
    // @param achievementId: string
    // @param progress: number
    // @returns: {success: boolean, progress: number}
    updateProgress: async (achievementId, progress) => {
        const response = await api.put(`/achievements/${achievementId}/progress`, { progress });
        return response.data;
    },

    // 업적 획득 처리
    // @param achievementId: string
    // @returns: {success: boolean, acquiredAt: Date}
    acquireAchievement: async (achievementId) => {
        const response = await api.post(`/achievements/${achievementId}/acquire`);
        return response.data;
    }
};

export const studyAPI = {
    // 대시보드 데이터 조회
    // @returns: {success: boolean, dashboard: {todayStats: DailyStats, level: Level, streak: Streak, schedule: Schedule[], goals: Goal[], weeklyStats: WeeklyStats[], growthRate: number}}
    getDashboardData: async () => {
        const response = await api.get('/study/dashboard');
        return response.data;
    },

    // 학습 세션 시작
    // @returns: {success: boolean, sessionId: string}
    startStudySession: async () => {
        const response = await api.post('/study/sessions/start');
        return response.data;
    },

    // 필요한 추가 API
    // updateCycles, getSessionStats
    // 학습 세션 종료
    // @param sessionId: string
    // @returns: {success: boolean, duration: number}
    endStudySession: async (sessionId) => {
        const response = await api.post(`/study/sessions/${sessionId}/end`);
        return response.data;
    },

    // 중복 기능이라 구현 X
    // 학습 통계 조회
    // @param params: {startDate?: string, endDate?: string}
    // @returns: {success: boolean, statistics: Statistics}
    getStatistics: async (params) => {
        const response = await api.get('/study/statistics', { params });
        return response.data;
    },

    // 구현 X
    // 추천 콘텐츠 조회
    // @returns: {success: boolean, recommendations: Recommendation[]}
    getRecommendations: async () => {
        const response = await api.get('/study/recommendations');
        return response.data;
    },

    // 학습 분석 데이터 조회
    // @param timeRange: 'week' | 'month' | 'year'
    // @returns: {subjects: {[key: string]: number}, weeklyHours: {labels: string[], datasets: {data: number[]}[]}, goals: {total: number, achieved: number}, monthlyProgress: {labels: string[], datasets: {data: number[]}[]}}
    getAnalytics: async (timeRange) => {
        const response = await api.get(`/study/analytics/${timeRange}`);
        return response.data;
    },

    // 과목별 분석 데이터 조회
    // @param subjectId: string
    // @param timeRange: 'week' | 'month' | 'year'
    // @returns: {analytics: SubjectAnalytics}
    getSubjectAnalytics: async (subjectId, timeRange) => {
        const response = await api.get(`/study/subjects/${subjectId}/analytics`, {
            params: { timeRange }
        });
        return response.data;
    },

    // 학습 일정 조회
    // @param date: string
    // @returns: {schedules: Schedule[]}
    getSchedules: async (date) => {
        const response = await api.get('/study/schedules', {
            params: { date }
        });
        return response.data;
    },

    // 학습 일정 생성
    // @param data: {title: string, startTime: Date, endTime: Date, repeat: boolean, notification: boolean, shared: boolean}
    // @returns: {success: boolean, schedule: Schedule}
    createSchedule: async (data) => {
        const response = await api.post('/study/schedules', data);
        return response.data;
    },

    // 학습 일정 수정
    // @param scheduleId: string
    // @param data: {title?: string, startTime?: Date, endTime?: Date, repeat?: boolean, notification?: boolean, shared?: boolean}
    // @returns: {success: boolean}
    updateSchedule: async (scheduleId, data) => {
        const response = await api.put(`/study/schedules/${scheduleId}`, data);
        return response.data;
    },

    // 학습 일정 삭제
    // @param scheduleId: string
    // @returns: {success: boolean}
    deleteSchedule: async (scheduleId) => {
        const response = await api.delete(`/study/schedules/${scheduleId}`);
        return response.data;
    },

    // feedbackAPI랑 중복
    // 학습 일지 저장
    // @param data: {content: string, achievements: string, difficulties: string, improvements: string, nextGoals: string}
    // @returns: {success: boolean}
    saveJournal: async (data) => {
        const response = await api.post('/study/feedback/journal', data);
        return response.data;
    },

    // 피드백 정보 조회
    // @returns: {selfEvaluation: SelfEvaluation, studyJournal: StudyJournal}
    getFeedback: async () => {
        const response = await api.get('/study/feedback');
        return response.data;
    },

    // 자기 평가 저장
    // @param data: {understanding: number, effort: number, efficiency: number, notes: string}
    // @returns: {success: boolean}
    saveSelfEvaluation: async (data) => {
        const response = await api.post('/study/feedback/self-evaluation', data);
        return response.data;
    },

    // 학습 자료 목록 조회
    // @returns: {materials: Material[]}
    getMaterials: async () => {
        const response = await api.get('/materials');
        return response.data;
    },

    // 학습 자료 업로드
    // @param formData: FormData
    // @returns: {success: boolean, material: Material}
    uploadMaterial: async (formData) => {
        const response = await api.post('/materials', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // 학습 자료 삭제
    // @param materialId: string
    // @returns: {success: boolean}
    deleteMaterial: async (materialId) => {
        const response = await api.delete(`/materials/${materialId}`);
        return response.data;
    },

    // 학습 자료 공유
    // @param materialId: string
    // @returns: {success: boolean}
    shareMaterial: async (materialId) => {
        const response = await api.post(`/materials/${materialId}/share`);
        return response.data;
    },

    // 학습 자료 버전 업데이트
    // @param materialId: string
    // @returns: {success: boolean}
    updateVersion: async (materialId) => {
        const response = await api.put(`/materials/${materialId}/version`);
        return response.data;
    },

    // 세션 통계 조회
    // @returns: {totalTime: number, completedCycles: number, averageFocusTime: number}
    getSessionStats: async () => {
        const response = await api.get('/study/sessions/stats');
        return response.data;
    },

    // 세션 종료
    // @param data: {cycles: number, notes: string, totalTime: number, focusMode: object, endTime: string}
    // @returns: {success: boolean}
    endSession: async (data) => {
        const response = await api.post('/study/sessions/end', data);
        return response.data;
    },

    // 세션 사이클 업데이트
    // @param data: {cycles: number, timestamp: string}
    // @returns: {success: boolean}
    updateCycles: async (data) => {
        const response = await api.put('/study/sessions/cycles', data);
        return response.data;
    },

    // 세션 노트 저장
    // @param data: {notes: string, sessionId: string}
    // @returns: {success: boolean}
    saveNotes: async (data) => {
        const response = await api.post('/study/sessions/notes', data);
        return response.data;
    },
};

export const levelAPI = {
    // 레벨 정보 조회
    // @returns: {currentLevel: number, currentXP: number, nextLevelXP: number}
    getLevelInfo: async () => {
        const response = await api.get('/levels/info');
        return response.data;
    },

    // 레벨 통계 조회
    // @returns: {totalXP: number, studyStreak: number}
    getLevelStats: async () => {
        const response = await api.get('/levels/stats');
        return response.data;
    },

    // 레벨 달성 조건 조회
    // @returns: {requirements: Requirement[]}
    getLevelRequirements: async () => {
        const response = await api.get('/levels/requirements');
        return response.data;
    },

    // 경험치 획득
    // @param data: {amount: number, type: string}
    // @returns: {success: boolean, newXP: number, levelUp?: boolean}
    gainExperience: async (data) => {
        const response = await api.post('/levels/experience', data);
        return response.data;
    }
};

export const notificationAPI = {
    // 알림 목록 조회
    // @returns: {success: boolean, notifications: Notification[]}
    getNotifications: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },

    // 알림 읽음 처리
    // @param notificationId: string
    // @returns: {success: boolean}
    markAsRead: async (notificationId) => {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    },

    // 모든 알림 읽음 처리
    // @returns: {success: boolean}
    markAllAsRead: async () => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    // 알림 삭제
    // @param notificationId: string
    // @returns: {success: boolean}
    deleteNotification: async (notificationId) => {
        const response = await api.delete(`/notifications/${notificationId}`);
        return response.data;
    },

    // FCM 토큰 등록
    // @param token: string
    // @returns: {success: boolean}
    registerFCMToken: async (token) => {
        const response = await api.post('/notifications/token', { token });
        return response.data;
    }
};

export const userAPI = {
    // 이름 유효성 검사
    // @param name: string
    // @returns: {isValid: boolean, message?: string}
    validateName: async (name) => {
        const response = await api.post('/users/validate-name', { name });
        return response.data;
    },

    // 이름 변경
    // @param name: string
    // @returns: {success: boolean}
    updateName: async (name) => {
        const response = await api.put('/users/name', { name });
        return response.data;
    },

    // 사용자 프로필 조회
    // @returns: {name: string, email: string, profileImage?: string}
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    // 프로필 이미지 업로드
    // @param type: 'background' | 'profile'
    // @param formData: FormData
    // @returns: {success: boolean, imageUrl: string}
    uploadImage: async (type, formData) => {
        const response = await api.post(`/users/profile/${type}-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    // 사용자 정보 조회
    // @returns: {name: string, phone: string, birthdate: string, id: string, email: string}
    getUserInfo: async () => {
        const response = await api.get('/users/info');
        return response.data;
    },

    // 사용자 정보 수정
    // @param data: {name?: string, phone?: string, birthdate?: string, password?: string}
    // @returns: {success: boolean}
    updateUserInfo: async (data) => {
        const response = await api.put('/users/info', data);
        return response.data;
    },

    // 전화번호 유효성 검사
    // @param phone: string
    // @returns: {isValid: boolean, message?: string}
    validatePhone: async (phone) => {
        const response = await api.post('/users/validate-phone', { phone });
        return response.data;
    },

    // 비밀번호 유효성 검사
    // @param password: string
    // @returns: {isValid: boolean, message?: string}
    validatePassword: async (password) => {
        const response = await api.post('/users/validate-password', { password });
        return response.data;
    },

    // 프로필 정보 업데이트
    // @param data: {backgroundImage?: string, profileImage?: string, name?: string, bio?: string}
    // @returns: {success: boolean}
    updateProfile: async (data) => {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    // 프로필 공개 설정 변경
    // @param data: {isPublic: boolean}
    // @returns: {success: boolean}
    updatePrivacy: async (data) => {
        const response = await api.put('/users/profile/privacy', data);
        return response.data;
    },

    // 연동 계정 해제
    // @param accountId: string
    // @returns: {success: boolean}
    disconnectAccount: async (accountId) => {
        const response = await api.delete(`/users/accounts/${accountId}`);
        return response.data;
    },

    // 비밀번호 변경
    // @param data: {currentPassword: string, newPassword: string}
    // @returns: {success: boolean}
    changePassword: async (data) => {
        const response = await api.put('/users/password', data);
        return response.data;
    },

    // 소셜 계정 목록 조회
    // @returns: {accounts: SocialAccount[]}
    getSocialAccounts: async () => {
        const response = await api.get('/users/social-accounts');
        return response.data;
    },

    // 주 계정 조회
    // @returns: {account: SocialAccount}
    getPrimaryAccount: async () => {
        const response = await api.get('/users/primary-account');
        return response.data;
    },

    // 주 계정 설정
    // @param accountId: string
    // @returns: {success: boolean}
    setPrimaryAccount: async (accountId) => {
        const response = await api.put(`/users/primary-account/${accountId}`);
        return response.data;
    },

    // 소셜 계정 연동 해제
    // @param accountId: string
    // @returns: {success: boolean}
    disconnectSocialAccount: async (accountId) => {
        const response = await api.delete(`/users/social-accounts/${accountId}`);
        return response.data;
    },
};

export const storageAPI = {
    // 현재 저장소 타입 조회
    // @returns: {type: 'device' | 'cloud'}
    getCurrentStorage: async () => {
        const response = await api.get('/storage/current');
        return response.data;
    },

    // 저장소 통계 조회
    // @returns: {deviceStorage: number, cloudStorage: number, lastSync: Date}
    getStorageStats: async () => {
        const response = await api.get('/storage/stats');
        return response.data;
    },

    // 저장소 타입 변경
    // @param data: {type: 'device' | 'cloud', transferData: boolean}
    // @returns: {success: boolean}
    changeStorageType: async (data) => {
        const response = await api.put('/storage/type', data);
        return response.data;
    },

    // 데이터 동기화
    // @returns: {success: boolean}
    syncData: async () => {
        const response = await api.post('/storage/sync');
        return response.data;
    }
};

export const settingsAPI = {
    // 현재 디스플레이 모드 조회
    // @returns: {mode: 'light' | 'dark'}
    getCurrentDisplayMode: async () => {
        const response = await api.get('/settings/display/mode');
        return response.data;
    },

    // 디스플레이 설정 조회
    // @returns: {autoMode: boolean, schedule: {start: string, end: string}}
    getDisplaySettings: async () => {
        const response = await api.get('/settings/display');
        return response.data;
    },

    // 디스플레이 모드 업데이트
    // @param data: {mode: 'light' | 'dark', autoMode: boolean, schedule: {start: string, end: string}}
    // @returns: {success: boolean}
    updateDisplayMode: async (data) => {
        const response = await api.put('/settings/display/mode', data);
        return response.data;
    },

    // 디스플레이 설정 업데이트
    // @param data: {autoMode: boolean, schedule: {start: string, end: string}}
    // @returns: {success: boolean}
    updateDisplaySettings: async (data) => {
        const response = await api.put('/settings/display', data);
        return response.data;
    },

    // 글자 크기 설정 조회
    // @returns: {fontSize: number, previewText: string}
    getFontSettings: async () => {
        const response = await api.get('/settings/font');
        return response.data;
    },

    // 글자 크기 설정 업데이트
    // @param data: {fontSize: number, applyGlobally: boolean}
    // @returns: {success: boolean}
    updateFontSettings: async (data) => {
        const response = await api.put('/settings/font', data);
        return response.data;
    },

    // 글자 크기 기본값 복원
    // @returns: {success: boolean, fontSize: number}
    resetFontSettings: async () => {
        const response = await api.post('/settings/font/reset');
        return response.data;
    },

    // 글자 크기 미리보기 텍스트 업데이트
    // @param data: {previewText: string}
    // @returns: {success: boolean}
    updatePreviewText: async (data) => {
        const response = await api.put('/settings/font/preview', data);
        return response.data;
    },

    // 설정 정보 조회
    // @returns: {settings: Settings}
    getSettings: async () => {
        const response = await api.get('/settings');
        return response.data;
    },

    // 알림 설정 조회
    // @returns: {notifications: NotificationSettings}
    getNotificationSettings: async () => {
        const response = await api.get('/settings/notifications');
        return response.data;
    },

    // 알림 설정 업데이트
    // @param data: {pushEnabled: boolean, emailEnabled: boolean, soundEnabled: boolean}
    // @returns: {success: boolean}
    updateNotificationSettings: async (data) => {
        const response = await api.put('/settings/notifications', data);
        return response.data;
    },

    // 테마 설정 조회 getDisplaySettings가 있어서 사용안해도 될듯
    // @returns: {theme: 'light' | 'dark' | 'system'}
    getThemeSettings: async () => {
        const response = await api.get('/settings/theme');
        return response.data;
    },

    // 테마 설정 업데이트 얘도 마찬가지
    // @param data: {theme: 'light' | 'dark' | 'system'}
    // @returns: {success: boolean}
    updateThemeSettings: async (data) => {
        const response = await api.put('/settings/theme', data);
        return response.data;
    },

    // 앱 버전 정보 조회
    // @returns: {version: string, needsUpdate: boolean}
    getAppVersion: async () => {
        const response = await api.get('/settings/version');
        return response.data;
    },

    // 알림 권한 요청
    // @returns: {granted: boolean}
    requestNotificationPermission: async () => {
        const response = await api.post('/settings/notifications/permission');
        return response.data;
    },

    // 개인정보 설정 조회
    // @returns: {isPublic: boolean, allowMessages: boolean, showActivity: boolean, showProgress: boolean}
    getPrivacySettings: async () => {
        const response = await api.get('/settings/privacy');
        return response.data;
    },

    // 개인정보 설정 업데이트
    // @param data: {isPublic: boolean, allowMessages: boolean, showActivity: boolean, showProgress: boolean}
    // @returns: {success: boolean}
    updatePrivacySettings: async (data) => {
        const response = await api.put('/settings/privacy', data);
        return response.data;
    },

    // 시스템 설정 열기
    // @returns: void
    openSystemSettings: () => {
        return api.post('/settings/system/open');
    },

    // 백업 설정 조회
    // @returns: {autoBackup: boolean, lastBackupDate: Date, backupLocation: string, backupSize: number, backupInterval: string}
    getBackupSettings: async () => {
        const response = await api.get('/settings/backup');
        return response.data;
    },

    // 자동 백업 설정 업데이트
    // @param data: {enabled: boolean, interval: string}
    // @returns: {success: boolean}
    updateAutoBackup: async (data) => {
        const response = await api.put('/settings/backup/auto', data);
        return response.data;
    },

    // 백업 생성
    // @returns: {success: boolean, backupSize: number}
    backupSettings: async () => {
        const response = await api.post('/settings/backup');
        return response.data;
    },

    // 백업 복원
    // @returns: {success: boolean}
    restoreSettings: async () => {
        const response = await api.post('/settings/backup/restore');
        return response.data;
    },

    // 설정 업데이트
    // @param data: {[key: string]: any}
    // @returns: {success: boolean}
    updateSettings: async (data) => {
        const response = await api.put('/settings', data);
        return response.data;
    },

    // 로그아웃
    // @returns: {success: boolean}
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    // 계정 삭제
    // @returns: {success: boolean}
    deleteAccount: async () => {
        const response = await api.delete('/users/account');
        return response.data;
    },

    // 시간 설정 조회
    // @param title: string
    // @returns: {startTime: Date, endTime: Date, enabled: boolean, days: string[]}
    getTimeSettings: async (title) => {
        const response = await api.get(`/settings/time/${title}`);
        return response.data;
    },

    // 시간 설정 업데이트
    // @param title: string
    // @param data: {startTime: Date, endTime: Date, enabled: boolean, days: string[]}
    // @returns: {success: boolean}
    updateTimeSettings: async (title, data) => {
        const response = await api.put(`/settings/time/${title}`, data);
        return response.data;
    },
};

export const goalAPI = {
    // 목표 생성
    // @param data: {title: string, category: 'short' | 'mid' | 'long', deadline: string, description: string}
    // @returns: {success: boolean}
    createGoal: async (data) => {
        const response = await api.post('/goals', data);
        return response.data;
    },

    // 목표 목록 조회
    // @param params?: {category?: string}
    // @returns: {goals: Goal[]}
    getGoals: async (params) => {
        const response = await api.get('/goals', { params });
        return response.data;
    },

    // 목표 상세 조회
    // @param goalId: string
    // @returns: {goal: Goal}
    getGoalDetail: async (goalId) => {
        const response = await api.get(`/goals/${goalId}`);
        return response.data;
    },

    // 목표 수정
    // @param goalId: string
    // @param data: {title?: string, deadline?: string, description?: string}
    // @returns: {success: boolean}
    updateGoal: async (goalId, data) => {
        const response = await api.put(`/goals/${goalId}`, data);
        return response.data;
    },

    // 목표 진행률 업데이트
    // @param goalId: string
    // @param data: {progress: number}
    // @returns: {success: boolean}
    updateGoalProgress: async (goalId, data) => {
        const response = await api.put(`/goals/${goalId}/progress`, data);
        return response.data;
    },

    // 목표 상태 변경
    // @param goalId: string
    // @param status: 'active' | 'completed' | 'archived'
    // @returns: {success: boolean}
    updateGoalStatus: async (goalId, status) => {
        const response = await api.put(`/goals/${goalId}/status`, { status });
        return response.data;
    },

    // 목표 삭제
    // @param goalId: string
    // @returns: {success: boolean}
    deleteGoal: async (goalId) => {
        const response = await api.delete(`/goals/${goalId}`);
        return response.data;
    },

    // 목표 카테고리 목록 조회
    // @returns: {categories: Category[]}
    getCategories: async () => {
        const response = await api.get('/goals/categories');
        return response.data;
    },

    // 목표 유효성 검사
    // @param data: {title: string, category: string, deadline: string, description: string}
    // @returns: {isValid: boolean, message?: string}
    validateGoal: async (data) => {
        const response = await api.post('/goals/validate', data);
        return response.data;
    },
};

export const feedbackAPI = {
    // 피드백 정보 조회
    // @returns: {selfEvaluation: SelfEvaluation, studyJournal: StudyJournal}
    getFeedback: async () => {
        const response = await api.get('/feedback');
        return response.data;
    },

    // 자기 평가 이력 조회
    // @returns: {selfEval: SelfEvaluation[]}
    getSelfEvaluationHistory: async () => {
        const response = await api.get('/feedback/self-evaluation/history');
        return response.data;
    },

    // 학습 일지 이력 조회
    // @returns: {journal: StudyJournal[]}
    getJournalHistory: async () => {
        const response = await api.get('/feedback/journal/history');
        return response.data;
    },

    // 자기 평가 저장
    // @param data: {understanding: number, effort: number, efficiency: number, notes: string, date: string}
    // @returns: {success: boolean}
    saveSelfEvaluation: async (data) => {
        const response = await api.post('/feedback/self-evaluation', data);
        return response.data;
    },

    // 학습 일지 저장
    // @param data: {date: string, content: string, achievements: string, difficulties: string, improvements: string, nextGoals: string}
    // @returns: {success: boolean}
    saveJournal: async (data) => {
        const response = await api.post('/feedback/journal', data);
        return response.data;
    }
};

export const materialAPI = {
    // 학습 자료 상세 조회
    // @param materialId: string
    // @returns: {material: Material}
    getMaterialDetail: async (materialId) => {
        const response = await api.get(`/materials/${materialId}`);
        return response.data;
    },

    // 학습 자료 수정
    // @param materialId: string
    // @param data: {title?: string, description?: string, content?: string, references?: string}
    // @returns: {success: boolean}
    updateMaterial: async (materialId, data) => {
        const response = await api.put(`/materials/${materialId}`, data);
        return response.data;
    },

    // 학습 자료 공유
    // @param materialId: string
    // @param data: {shareType: string, recipients?: string[]}
    // @returns: {success: boolean}
    shareMaterial: async (materialId, data) => {
        const response = await api.post(`/materials/${materialId}/share`, data);
        return response.data;
    },

    // 학습 자료 다운로드
    // @param materialId: string
    // @returns: {downloadUrl: string}
    getMaterialDownloadUrl: async (materialId) => {
        const response = await api.get(`/materials/${materialId}/download`);
        return response.data;
    }
};

export default api;
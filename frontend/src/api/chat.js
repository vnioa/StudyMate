// api/chat.js

import axios from 'axios';
import {API_URL} from "../config/ApiUrl";
import io from 'socket.io-client';

// WebSocket 초기화 함수
const socket = io(API_URL, {
    transports: ['websocket'],
    reconnect: true,
    reconnectionAttempts: 10,
})

// 1. 채팅방 관리

// 채팅방 목록 가져오기
export const getChatRooms = async () => {
    try {
        const response = await axios.get(`${API_URL}/rooms`);
        return response.data;
    } catch (error) {
        console.error("Error fetching chat rooms:", error);
        throw error;
    }
};

// 특정 채팅방의 메시지 가져오기
export const getMessages = async (roomId) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}/messages`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching messages for room ${roomId}:`, error);
        throw error;
    }
};

// 메시지 전송하기
export const sendMessage = async (roomId, message) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/messages`, message);
        return response.data;
    } catch (error) {
        console.error(`Error sending message to room ${roomId}:`, error);
        throw error;
    }
};

// 채팅방 생성하기
export const createChatRoom = async (roomData) => {
    try {
        const response = await axios.post(`${API_URL}/rooms`, roomData);
        return response.data;
    } catch (error) {
        console.error("Error creating chat room:", error);
        throw error;
    }
};

// 2. 파일 및 미디어 관리

// 파일 전송하기
export const sendFile = async (roomId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error sending file to room ${roomId}:`, error);
        throw error;
    }
};

// 채팅 내 첨부 파일 검색
export const searchAttachments = async (roomId, query) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}/files/search`, {params: {query}});
        return response.data;
    } catch (error) {
        console.error("Error searching attachments:", error);
        throw error;
    }
};

// 3. 보안 및 암호화 설정

// 보안 채팅방 생성
export const createSecureRoom = async (roomData) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/secure`, roomData);
        return response.data;
    } catch (error) {
        console.error("Error creating secure room:", error);
        throw error;
    }
};

// 종단간 암호화 설정
export const enableEndToEndEncryption = async (roomId) => {
    try {
        const response = await axios.put(`${API_URL}/rooms/${roomId}/encryption`);
        return response.data;
    } catch (error) {
        console.error("Error enabling encryption for room:", error);
        throw error;
    }
};

// 4. 알림 설정 및 관리

// 채팅방 알림 설정
export const updateNotificationSettings = async (roomId, settings) => {
    try {
        const response = await axios.put(`${API_URL}/rooms/${roomId}/notifications`, settings);
        return response.data;
    } catch (error) {
        console.error(`Error updating notification settings for room ${roomId}:`, error);
        throw error;
    }
};

// 푸시 알림 설정
export const setPushNotifications = async (settings) => {
    try {
        const response = await axios.put(`${API_URL}/notifications/push`, settings);
        return response.data;
    } catch (error) {
        console.error("Error setting push notifications:", error);
        throw error;
    }
};

// 5. 검색 및 정렬

// 채팅 메시지 검색
export const searchMessages = async (roomId, keyword) => {
    try {
        const response = await axios.get(`${API_URL}/rooms/${roomId}/messages/search`, {params: {keyword}});
        return response.data;
    } catch (error) {
        console.error("Error searching messages:", error);
        throw error;
    }
};

// 메시지 필터 설정
export const setMessageFilter = async (roomId, filterOptions) => {
    try {
        const response = await axios.put(`${API_URL}/rooms/${roomId}/messages/filter`, filterOptions);
        return response.data;
    } catch (error) {
        console.error("Error setting message filter:", error);
        throw error;
    }
};

// 6. 그룹 및 멤버 관리

// 그룹 채팅방 초대 링크 생성
export const createInviteLink = async (roomId) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/invite-link`);
        return response.data;
    } catch (error) {
        console.error("Error creating invite link:", error);
        throw error;
    }
};

// 그룹 사용자 초대
export const inviteUserToRoom = async (roomId, userId) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/invite`, {userId});
        return response.data;
    } catch (error) {
        console.error(`Error inviting user ${userId} to room ${roomId}:`, error);
        throw error;
    }
};

// 7. 채팅방 관리자 기능

// 채팅방 관리자 설정
export const setRoomAdmin = async (roomId, userId) => {
    try {
        const response = await axios.put(`${API_URL}/rooms/${roomId}/admin`, {userId});
        return response.data;
    } catch (error) {
        console.error("Error setting room admin:", error);
        throw error;
    }
};

// 그룹 공지사항 설정
export const setGroupAnnouncement = async (roomId, announcement) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/announcement`, {announcement});
        return response.data;
    } catch (error) {
        console.error("Error setting group announcement:", error);
        throw error;
    }
};

// 8. 친구 및 초대 관리

// 친구 요청 전송
export const sendFriendRequest = async (userId) => {
    try {
        const response = await axios.post(`${API_URL}/friends/request`, {userId});
        return response.data;
    } catch (error) {
        console.error("Error sending friend request:", error);
        throw error;
    }
};

// 친구 추가 (QR 코드 이용)
export const addFriendViaQRCode = async (qrData) => {
    try {
        const response = await axios.post(`${API_URL}/friends/add/qr`, {qrData});
        return response.data;
    } catch (error) {
        console.error("Error adding friend via QR code:", error);
        throw error;
    }
};

// 9. 개인 메모 및 사용자 설정

// 개인 메모 추가
export const addPersonalNote = async (roomId, note) => {
    try {
        const response = await axios.post(`${API_URL}/rooms/${roomId}/note`, {note});
        return response.data;
    } catch (error) {
        console.error("Error adding personal note:", error);
        throw error;
    }
};

// 상태 메시지 업데이트
export const updateStatusMessage = async (statusMessage) => {
    try {
        const response = await axios.put(`${API_URL}/status`, {statusMessage});
        return response.data;
    } catch (error) {
        console.error("Error updating status message:", error);
        throw error;
    }
};

export const getUserStatus = async (userId) => {
    try {
        const response = await axios.get(`/api/status/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user status:', error);
        throw error;
    }
};

export const fetchMessages = async (chatId) => {
    try {
        const response = await axios.get(`/api/chats/${chatId}/messages`);
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

// 메시지 목록을 가져오는 함수
export const fetchMessages = async (chatId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        return data.messages; // 서버에서 반환하는 메시지 리스트 형태에 맞게 수정
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

// 예약된 메시지 목록을 가져오는 함수
export const fetchScheduledMessages = async (chatId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/scheduled-messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch scheduled messages');
        }
        const data = await response.json();
        return data.scheduledMessages; // 서버에서 반환하는 예약 메시지 리스트 형태에 맞게 수정
    } catch (error) {
        console.error('Error fetching scheduled messages:', error);
        throw error;
    }
};

// 메시지를 예약하는 함수
export const scheduleMessage = async (chatId, message) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/schedule-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message.message,
                date: message.date.toISOString(), // 날짜를 ISO 형식으로 변환하여 전송
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to schedule message');
        }
        const data = await response.json();
        return data.scheduledMessage; // 서버에서 반환하는 예약 메시지 형태에 맞게 수정
    } catch (error) {
        console.error('Error scheduling message:', error);
        throw error;
    }
};


// 채팅 관련 API 호출과 WebSocket 이벤트를 포함하는 모듈
export const ChatService = {
    // 실시간 채팅방에 연결
    joinChatRoom: (roomId, userId) => {
        socket.emit('joinRoom', {roomId, userId});
    },

    // 채팅방에서 나가기
    leaveChatRoom: (roomId) => {
        socket.emit('leaveRoom', {roomId});
    },

    // 메시지 전송(텍스트 메시지)
    sendMessage: async (roomId, messageContent, userId) => {
        try {
            const response = await axios.post(`${API_URL}/chat/send`, {
                roomId,
                content: messageContent,
                userId,
            });
            return response.data;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    // 답장 기능
    sendReply: async (roomId, messageId, replyContent, userId) => {
        try {
            const response = await axios.post(`${API_URL}/chat/reply`, {
                roomId,
                messageId,
                content: replyContent,
                userId,
            });
            return response.data;
        } catch (error) {
            console.error('Error sending reply: ', error);
            throw error;
        }
    },

    // 메시지 예약 전송
    scheduleMessage: async (roomId, messageContent, userId, scheduleTime) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/chat/schedule`, {
                roomId,
                content: messageContent,
                userId,
                scheduleTime,
            });
            return response.data;
        } catch (error) {
            console.error('Error scheduling message:', error);
            throw error;
        }
    },

    // 메시지 흐름 애니메이션 설정
    animateMessageFlow: (message) => {
        socket.emit('animateMessage', {message});
    },

    // 파일 및 미디어 전송
    sendFile: async (roomId, file, userId) => {
        const formData = new FormData();
        formData.append('roomId', roomId);
        formData.append('file', file);
        formData.append('userId', userId);

        try {
            const response = await axios.post(`${API_URL}/chat/file`, formData, {
                headers: {'Content-Type': 'multipart/form-data'},
            });
            return response.data;
        } catch (error) {
            console.error('Error sending file:', error);
            throw error;
        }
    },

    // 채팅방 읽음 통계 업데이트
    updateReadStatus: (roomId, userId) => {
        socket.emit('updateReadStatus', {roomId, userId});
    },

    // 메시지별 태그 설정
    tagMessage: async (messageId, tags) => {
        try {
            const response = await axios.post(`${API_URL}/chat/tag`, {
                messageId,
                tags,
            });
            return response.data;
        } catch (error) {
            console.error('Error tagging message:', error);
            throw error;
        }
    },

    // 미디어 파일 자동 삭제 설정
    setAutoDeleteMedia: async (roomId, duration) => {
        try {
            const response = await axios.post(`${API_URL}/chat/autodelete`, {
                roomId,
                duration,
            });
            return response.data;
        } catch (error) {
            console.error('Error setting auto-delete for media:', error);
            throw error;
        }
    },

    // 메시지 수신 이벤트 설정
    onReceiveMessage: (callback) => {
        socket.on('newMessage', callback);
    },

    // 사용자 온라인 상태 업데이트 이벤트
    onUserStatusUpdate: (callback) => {
        socket.on('userStatus', callback);
    },

    // 관리자 로그 조회
    getAdminLogs: async (roomId) => {
        try {
            const response = await axios.get(`${API_URL}/chat/adminLogs`, {
                params: {roomId},
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching admin logs:', error);
            throw error;
        }
    },

    // 채팅방 링크 만료 설정
    setLinkExpiration: async (roomId, expirationDate) => {
        try {
            const response = await axios.post(`${API_URL}/chat/linkExpiration`, {
                roomId,
                expirationDate,
            });
            return response.data;
        } catch (error) {
            console.error('Error setting link expiration:', error);
            throw error;
        }
    },
};
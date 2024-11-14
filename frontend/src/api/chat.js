// api/chat.js

import axios from 'axios';
import {API_URL} from "../config/ApiUrl";
import io from 'socket.io-client';
import {encryptFile} from "../utils/encryptionUtils";
import {compressImage} from "../utils/fileUtils";

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
        const response = await axios.get(`${API_URL}/api/status/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user status:', error);
        throw error;
    }
};

export const fetchMessages = async (chatId) => {
    try {
        const response = await axios.get(`${API_URL}/api/chats/${chatId}/messages`);
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
};

// 메시지 목록을 가져오는 함수
export const fetchMessages = async (chatId) => {
    try {
        const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
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
        const response = await fetch(`${API_URL}/chats/${chatId}/scheduled-messages`, {
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
        const response = await fetch(`${API_URL}/chats/${chatId}/schedule-message`, {
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

// 특정 채팅방에 파일을 업로드합니다.
export const uploadFile = async (chatId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_URL}/chats/${chatId}/files/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// 파일에 만료 날짜를 설정하여, 일정 기간 후 파일이 삭제되도록 합니다.
export const setFileExpiration = async (fileId, expirationDate) => {
    const response = await axios.put(`${API_URL}/files/${fileId}/expiration`, {
        expirationDate,
    });
    return response.data;
};

// 파일의 크기가 설정된 최대 크기를 초과하는지 확인합니다.
export const validateFileSize = (file, maxSize) => {
    if (file.size > maxSize) {
        throw new Error('File size exceeds the maximum allowed limit');
    }
};

// 암호화된 파일을 특정 채팅방에 업로드합니다.
export const uploadEncryptedFile = async (chatId, encryptedFile) => {
    const formData = new FormData();
    formData.append('file', encryptedFile);
    const response = await axios.post(`${API_URL}/chats/${chatId}/files/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// 파일 전송 알림을 특정 채팅방에 전송합니다.
export const sendFileNotification = async (chatId, fileName) => {
    const response = await axios.post(`${API_URL}/chats/${chatId}/notifications`, {
        message: `File ${fileName} has been sent`,
    });
    return response.data;
};

// 이미지 파일을 압축하여 저장 공간을 절약하고 전송 속도를 높입니다.
export const compressImage = async (imageFile) => {
    return imageFile; // 실제 구현 시 이미지 압축 로직이 필요합니다.
};

// 여러 이미지 파일(앨범)을 특정 채팅방에 업로드합니다.
export const uploadAlbum = async (chatId, albumFiles) => {
    const formData = new FormData();
    albumFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
    });
    const response = await axios.post(`${API_URL}/chats/${chatId}/albums/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
    return response.data;
};

/**
 * sendFile - 파일을 서버로 전송하는 함수
 * @param {string} chatId - 채팅방 ID
 * @param {File} file - 전송할 파일 객체
 * @returns {Object} - 서버 응답 데이터
 */
export const sendFile = async (chatId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_URL}/${chatId}/file/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
};

/**
 * searchFilesInChat - 채팅 내 첨부 파일 검색
 * @param {string} chatId - 채팅방 ID
 * @param {string} query - 검색어
 * @returns {Array} - 검색된 파일 목록
 */
export const searchFilesInChat = async (chatId, query) => {
    try {
        const response = await axios.get(`${API_URL}/${chatId}/files/search`, {
            params: { query },
        });
        return response.data;
    } catch (error) {
        console.error('File search failed:', error);
        throw error;
    }
};

/**
 * setFileExpiry - 파일 만료 설정
 * @param {string} chatId - 채팅방 ID
 * @param {string} fileId - 파일 ID
 * @param {Date} expiryDate - 만료 날짜
 * @returns {Object} - 서버 응답 데이터
 */
export const setFileExpiry = async (chatId, fileId, expiryDate) => {
    try {
        const response = await axios.put(`${API_URL}/${chatId}/file/${fileId}/expiry`, {
            expiryDate,
        });
        return response.data;
    } catch (error) {
        console.error('Setting file expiry failed:', error);
        throw error;
    }
};

/**
 * notifyFileSent - 파일 전송 알림 설정
 * @param {string} chatId - 채팅방 ID
 * @param {Object} fileInfo - 파일 정보 (이름, 크기 등)
 * @returns {Object} - 서버 응답 데이터
 */
export const notifyFileSent = async (chatId, fileInfo) => {
    try {
        const response = await axios.post(`${API_URL}/${chatId}/file/notify`, fileInfo);
        return response.data;
    } catch (error) {
        console.error('File notification failed:', error);
        throw error;
    }
};

/**
 * sendEncryptedFile - 암호화된 파일 전송
 * @param {string} chatId - 채팅방 ID
 * @param {File} file - 전송할 파일 객체
 * @returns {Object} - 서버 응답 데이터
 */
export const sendEncryptedFile = async (chatId, file) => {
    const encryptedFile = await encryptFile(file); // 파일 암호화 함수 호출
    const formData = new FormData();
    formData.append('file', encryptedFile);

    try {
        const response = await axios.post(`${API_URL}/${chatId}/file/encrypted-upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Encrypted file upload failed:', error);
        throw error;
    }
};

/**
 * sendCompressedImage - 압축된 이미지 파일을 서버에 전송
 * @param {string} chatId - 채팅 ID
 * @param {Object} file - 파일 객체 (URI 포함)
 * @returns {Promise<Object>} - 서버 응답 데이터
 */
export const sendCompressedImage = async (chatId, file) => {
    try {
        // 이미지 파일 압축
        const compressedFile = await compressImage(file);

        // FormData 생성 후 파일 추가
        const formData = new FormData();
        formData.append('file', {
            uri: compressedFile.uri,
            name: compressedFile.name,
            type: compressedFile.type,
        });

        // 서버로 FormData 전송
        const response = await axios.post(`${API_URL}/api/chat/${chatId}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Failed to send compressed image:', error);
        throw error;
    }
};
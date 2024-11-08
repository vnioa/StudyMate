// src/services/socket.js

import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = new Map();
    }

    // 소켓 연결 초기화
    async initialize() {
        try {
            const token = await AsyncStorage.getItem('token');

            this.socket = io('https://api.studymate.com', {
                transports: ['websocket'],
                auth: {
                    token
                },
                query: {
                    platform: Platform.OS,
                    version: '1.0.0'
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000
            });

            this.setupListeners();
            return true;
        } catch (error) {
            console.error('Socket initialization failed:', error);
            return false;
        }
    }

    // 기본 이벤트 리스너 설정
    setupListeners() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('Socket connected');
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('Socket disconnected:', reason);
            this.handleDisconnect(reason);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            this.reconnectAttempts = attemptNumber;
            console.log('Reconnecting...', attemptNumber);
        });
    }

    // 연결 해제 처리
    handleDisconnect(reason) {
        if (reason === 'io server disconnect') {
            // 서버에서 연결을 끊은 경우
            setTimeout(() => {
                this.socket.connect();
            }, 1000);
        }
    }

    // 채팅 관련 이벤트
    chat = {
        // 채팅방 입장
        joinRoom: (roomId) => {
            this.socket.emit('chat:join', { roomId });
        },

        // 채팅방 퇴장
        leaveRoom: (roomId) => {
            this.socket.emit('chat:leave', { roomId });
        },

        // 메시지 전송
        sendMessage: (roomId, message) => {
            this.socket.emit('chat:message', { roomId, message });
        },

        // 메시지 수신 리스너
        onMessage: (callback) => {
            this.socket.on('chat:message', callback);
        },

        // 타이핑 상태 전송
        sendTyping: (roomId, isTyping) => {
            this.socket.emit('chat:typing', { roomId, isTyping });
        },

        // 타이핑 상태 수신 리스너
        onTyping: (callback) => {
            this.socket.on('chat:typing', callback);
        }
    };

    // 학습 관련 이벤트
    study = {
        // 학습 세션 참여
        joinSession: (sessionId) => {
            this.socket.emit('study:join', { sessionId });
        },

        // 학습 세션 퇴장
        leaveSession: (sessionId) => {
            this.socket.emit('study:leave', { sessionId });
        },

        // 학습 진행 상태 업데이트
        updateProgress: (sessionId, progress) => {
            this.socket.emit('study:progress', { sessionId, progress });
        },

        // 진행 상태 수신 리스너
        onProgressUpdate: (callback) => {
            this.socket.on('study:progress', callback);
        }
    };

    // 그룹 관련 이벤트
    group = {
        // 그룹 활동 상태 업데이트
        updateActivity: (groupId, activity) => {
            this.socket.emit('group:activity', { groupId, activity });
        },

        // 그룹 활동 수신 리스너
        onActivityUpdate: (callback) => {
            this.socket.on('group:activity', callback);
        },

        // 그룹 멤버 상태 변경 리스너
        onMemberStatusChange: (callback) => {
            this.socket.on('group:member_status', callback);
        }
    };

    // 화상 통화 관련 이벤트
    videoCall = {
        // 통화 시작
        startCall: (roomId, userData) => {
            this.socket.emit('call:start', { roomId, userData });
        },

        // 통화 종료
        endCall: (roomId) => {
            this.socket.emit('call:end', { roomId });
        },

        // 통화 상태 변경 리스너
        onCallStatusChange: (callback) => {
            this.socket.on('call:status', callback);
        },

        // 시그널링 데이터 전송
        sendSignal: (roomId, signal) => {
            this.socket.emit('call:signal', { roomId, signal });
        },

        // 시그널링 데이터 수신 리스너
        onSignal: (callback) => {
            this.socket.on('call:signal', callback);
        }
    };

    // 알림 관련 이벤트
    notification = {
        // 알림 수신 리스너
        onNotification: (callback) => {
            this.socket.on('notification', callback);
        }
    };

    // 이벤트 리스너 등록
    on(event, callback) {
        this.socket.on(event, callback);
        this.listeners.set(event, callback);
    }

    // 이벤트 리스너 제거
    off(event) {
        const callback = this.listeners.get(event);
        if (callback) {
            this.socket.off(event, callback);
            this.listeners.delete(event);
        }
    }

    // 연결 해제
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // 재연결
    reconnect() {
        if (!this.socket || !this.isConnected) {
            this.initialize();
        }
    }
}

export default new SocketService();
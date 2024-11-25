import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from "../config/apiUrl";

class SocketService {
    constructor() {
        this.socket = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const token = await AsyncStorage.getItem('token');

        this.socket = io(`${API_URL}`, {
            auth: {
                token
            },
            transports: ['websocket'],
            autoConnect: false
        });

        this.setupEventListeners();
        this.initialized = true;
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.socket.on('reconnect_attempt', () => {
            console.log('Attempting to reconnect...');
        });
    }

    connect() {
        if (this.socket) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    // 채팅방 관련 메서드
    joinRoom(roomId) {
        this.socket.emit('join_room', roomId);
    }

    leaveRoom(roomId) {
        this.socket.emit('leave_room', roomId);
    }

    sendMessage(roomId, message) {
        this.socket.emit('send_message', { roomId, message });
    }

    onNewMessage(callback) {
        this.socket.on('receive_message', callback);
    }

    // 타이핑 상태 관련 메서드
    sendTyping(roomId, isTyping) {
        this.socket.emit('typing', { roomId, isTyping });
    }

    onUserTyping(callback) {
        this.socket.on('user_typing', callback);
    }

    // 읽음 상태 관련 메서드
    markAsRead(roomId, messageId) {
        this.socket.emit('mark_as_read', { roomId, messageId });
    }

    onMessageRead(callback) {
        this.socket.on('message_read', callback);
    }

    // 온라인 상태 관련 메서드
    updateOnlineStatus(status) {
        this.socket.emit('update_status', status);
    }

    onUserStatusChange(callback) {
        this.socket.on('user_status_change', callback);
    }

    // 이벤트 리스너 제거
    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

const socketService = new SocketService();
export default socketService;
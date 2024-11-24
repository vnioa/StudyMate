const socketIO = require('socket.io');
const redis = require('../config/redis');
const jwt = require('jsonwebtoken');

class SocketServer {
    constructor(server) {
        this.io = socketIO(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // 소켓 인증 미들웨어
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.id;
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', async (socket) => {
            console.log(`User connected: ${socket.userId}`);

            // 사용자 온라인 상태 설정
            await redis.setUserOnline(socket.userId);

            // 채팅방 참여
            socket.on('join_room', async (roomId) => {
                socket.join(roomId);
                await redis.addRoomParticipant(roomId, socket.userId);

                // 참여자 목록 업데이트
                const participants = await redis.getRoomParticipants(roomId);
                this.io.to(roomId).emit('participants_updated', participants);
            });

            // 메시지 전송
            socket.on('send_message', async (data) => {
                const { roomId, message } = data;

                // 메시지 캐싱
                await redis.cacheMessage(roomId, {
                    userId: socket.userId,
                    message,
                    timestamp: new Date()
                });

                // 메시지 브로드캐스트
                this.io.to(roomId).emit('receive_message', {
                    userId: socket.userId,
                    message,
                    timestamp: new Date()
                });
            });

            // 타이핑 상태
            socket.on('typing', (roomId) => {
                socket.to(roomId).emit('user_typing', socket.userId);
            });

            // 읽음 상태 업데이트
            socket.on('mark_read', async (data) => {
                const { roomId, messageId } = data;
                this.io.to(roomId).emit('message_read', {
                    userId: socket.userId,
                    messageId
                });
            });

            // 연결 해제
            socket.on('disconnect', async () => {
                console.log(`User disconnected: ${socket.userId}`);
                await redis.setUserOffline(socket.userId);

                // 참여중인 모든 방의 참여자 목록 업데이트
                const rooms = Array.from(socket.rooms);
                for (const roomId of rooms) {
                    const participants = await redis.getRoomParticipants(roomId);
                    this.io.to(roomId).emit('participants_updated', participants);
                }
            });
        });
    }
}

module.exports = SocketServer;
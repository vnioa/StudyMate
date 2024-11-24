const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const socketMiddleware = (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error: Token not provided'));
        }

        // 토큰 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;

        // Redis에 소켓 연결 정보 저장
        redis.client.hSet(
            `socket:${decoded.id}`,
            socket.id,
            JSON.stringify({
                connected: true,
                lastActive: new Date()
            })
        );

        // 연결 해제 시 Redis에서 소켓 정보 제거
        socket.on('disconnect', async () => {
            await redis.client.hDel(`socket:${decoded.id}`, socket.id);
        });

        next();
    } catch (error) {
        console.error('Socket 인증 오류:', error);
        next(new Error('Authentication error: Invalid token'));
    }
};

// 소켓 연결 상태 확인
const checkSocketConnection = async (userId) => {
    try {
        const sockets = await redis.client.hGetAll(`socket:${userId}`);
        return Object.keys(sockets).length > 0;
    } catch (error) {
        console.error('소켓 연결 상태 확인 오류:', error);
        return false;
    }
};

// 특정 사용자의 모든 소켓에 이벤트 발송
const emitToUser = async (io, userId, event, data) => {
    try {
        const sockets = await redis.client.hGetAll(`socket:${userId}`);
        Object.keys(sockets).forEach(socketId => {
            io.to(socketId).emit(event, data);
        });
    } catch (error) {
        console.error('이벤트 발송 오류:', error);
    }
};

module.exports = {
    socketMiddleware,
    checkSocketConnection,
    emitToUser
};
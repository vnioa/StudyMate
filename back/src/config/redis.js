const Redis = require('redis');

class RedisClient {
    constructor() {
        this.client = null;
    }

    // Redis 클라이언트 연결
    async connect() {
        try {
            this.client = Redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                retry_strategy: (options) => {
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        return new Error('Retry time exhausted');
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });

            this.client.on('error', (err) => console.error('Redis Client Error:', err));
            this.client.on('connect', () => console.log('Redis Client Connected'));

            await this.client.connect();
        } catch (error) {
            console.error('Redis 연결 오류:', error);
            throw error;
        }
    }

    // 메시지 캐싱
    async cacheMessage(roomId, message) {
        try {
            const key = `chat:${roomId}:messages`;
            await this.client.lPush(key, JSON.stringify(message));
            await this.client.expire(key, 60 * 60 * 24); // 24시간 유지
        } catch (error) {
            console.error('메시지 캐싱 오류:', error);
            throw error;
        }
    }

    // 캐시된 메시지 조회
    async getCachedMessages(roomId) {
        try {
            const key = `chat:${roomId}:messages`;
            const messages = await this.client.lRange(key, 0, -1);
            return messages.map(msg => JSON.parse(msg));
        } catch (error) {
            console.error('캐시 메시지 조회 오류:', error);
            throw error;
        }
    }

    // 온라인 사용자 관리
    async setUserOnline(userId) {
        try {
            await this.client.sAdd('online_users', userId);
        } catch (error) {
            console.error('온라인 상태 설정 오류:', error);
            throw error;
        }
    }

    // 사용자 오프라인 처리
    async setUserOffline(userId) {
        try {
            await this.client.sRem('online_users', userId);
        } catch (error) {
            console.error('오프라인 상태 설정 오류:', error);
            throw error;
        }
    }

    // 채팅방 참여자 목록 관리
    async addRoomParticipant(roomId, userId) {
        try {
            await this.client.sAdd(`chat:${roomId}:participants`, userId);
        } catch (error) {
            console.error('참여자 추가 오류:', error);
            throw error;
        }
    }

    // Redis 연결 종료
    async disconnect() {
        try {
            await this.client.quit();
            console.log('Redis 연결이 종료되었습니다.');
        } catch (error) {
            console.error('Redis 연결 종료 오류:', error);
            throw error;
        }
    }
}

module.exports = new RedisClient();
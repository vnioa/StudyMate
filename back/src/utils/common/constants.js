const CONSTANTS = {
    // 파일 관련 상수
    FILE: {
        MAX_SIZE: 100 * 1024 * 1024, // 100MB
        ALLOWED_TYPES: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        UPLOAD_PATH: 'uploads/'
    },

    // 인증 관련 상수
    AUTH: {
        JWT_EXPIRY: '7d',
        VERIFICATION_CODE_LENGTH: 6,
        PASSWORD_MIN_LENGTH: 8,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24시간
    },

    // 메시지 관련 상수
    MESSAGE: {
        MAX_LENGTH: 1000,
        TYPES: {
            TEXT: 'text',
            FILE: 'file',
            IMAGE: 'image',
            SYSTEM: 'system'
        }
    },

    // 채팅방 관련 상수
    CHAT_ROOM: {
        TYPES: {
            DIRECT: 'direct',
            GROUP: 'group'
        },
        MAX_NAME_LENGTH: 50,
        MIN_PARTICIPANTS: 2
    },

    // API 응답 코드
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_ERROR: 500
    },

    // 데이터베이스 관련 상수
    DATABASE: {
        PAGE_SIZE: 50,
        MAX_CONNECTIONS: 10,
        TIMEOUT: 10000
    },

    // 캐시 관련 상수
    CACHE: {
        TTL: 3600, // 1시간
        PREFIX: {
            USER: 'user:',
            CHAT: 'chat:',
            FILE: 'file:'
        }
    }
};

module.exports = CONSTANTS;
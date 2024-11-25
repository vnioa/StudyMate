const CONSTANTS = {
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

    // 인증 관련 상수
    AUTH: {
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRY: '7d',
        VERIFICATION_CODE_LENGTH: 7,
        PASSWORD_MIN_LENGTH: 8,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24시간
        VERIFICATION_CODE_EXPIRY: 30 * 60 * 1000 // 30분
    },

    // 이메일 설정
    EMAIL: {
        SMTP_HOST: 'smtp.naver.com',
        SMTP_PORT: 465,
        SMTP_SECURE: true,
        VERIFICATION_SUBJECT: 'StudyMate 인증 코드'
    },

    // 데이터베이스 관련 상수
    DATABASE: {
        PAGE_SIZE: 20,
        MAX_CONNECTIONS: 10,
        TIMEOUT: 10000
    },

    // 파일 업로드 관련 상수
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

    // 사용자 상태
    USER_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        SUSPENDED: 'suspended'
    },

    // 메시지 타입
    MESSAGE_TYPE: {
        TEXT: 'text',
        IMAGE: 'image',
        FILE: 'file',
        SYSTEM: 'system'
    },

    // 채팅방 타입
    ROOM_TYPE: {
        DIRECT: 'direct',
        GROUP: 'group'
    },

    // 친구 관계 상태
    FRIEND_STATUS: {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        BLOCKED: 'blocked'
    }
};

module.exports = CONSTANTS;
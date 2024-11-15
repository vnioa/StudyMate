// constants/config.js
export const CONFIG = {
    // API 설정
    API: {
        TIMEOUT: 10000,
        RETRY_COUNT: 3,
        CACHE_TIME: 5 * 60 * 1000 // 5분
    },

    // 파일 업로드 설정
    UPLOAD: {
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
        ALLOWED_TYPES: ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
        MAX_FILES: 10
    },

    // 캐시 설정
    CACHE: {
        STORAGE_KEY: '@StudyMate:',
        EXPIRY: {
            SHORT: 5 * 60 * 1000,    // 5분
            MEDIUM: 30 * 60 * 1000,  // 30분
            LONG: 24 * 60 * 60 * 1000 // 24시간
        }
    },

    // 인증 설정
    AUTH: {
        TOKEN_KEY: '@StudyMate:token',
        REFRESH_TOKEN_KEY: '@StudyMate:refreshToken',
        SESSION_TIMEOUT: 30 * 60 * 1000 // 30분
    },

    // 앱 설정
    APP: {
        VERSION: '1.0.0',
        BUILD_NUMBER: '1',
        PLATFORM: {
            IOS: 'ios',
            ANDROID: 'android'
        }
    }
};
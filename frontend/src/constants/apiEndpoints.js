// constants/apiEndpoints.js

const BASE_URL = 'http://121.127.165.43:3000';

export const API_ENDPOINTS = {
    // 기본 URL
    BASE_URL,

    // 인증 관련
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh-token',
        VERIFY_EMAIL: '/auth/verify-email',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password',
        SOCIAL_LOGIN: {
            GOOGLE: '/auth/google',
            KAKAO: '/auth/kakao',
            NAVER: '/auth/naver'
        }
    },

    // 홈 섹션
    HOME: {
        // 웰컴 섹션
        WELCOME: '/welcome',
        TODAY_GOALS: '/goals/today',
        MILESTONES: '/milestones',

        // 성취 섹션
        ACHIEVEMENTS: '/achievements',
        RECENT_BADGES: '/achievements/badges/recent',
        LEARNING_PROGRESS: '/achievements/progress',
        STUDY_STATISTICS: '/achievements/statistics',

        // 목표 섹션
        GOALS: '/goals',
        GOAL_PROGRESS: '/goals/progress',
        AI_FEEDBACK: '/goals/feedback',
        REMINDERS: '/goals/reminders',

        // 학습 섹션
        PERSONALIZED_CONTENT: '/learning/personalized',
        POPULAR_CONTENT: '/learning/popular',
        RECOMMENDATIONS: '/learning/recommendations',

        // 스터디 그룹 섹션
        GROUPS: '/groups',
        COMMUNITY_FEED: '/community/feed',
        GROUP_NOTIFICATIONS: '/groups/notifications'
    },

    // 학습 관리
    LEARNING: {
        CONTENT: '/content',
        SEARCH: '/content/search',
        FILTER: '/content/filter',
        HISTORY: '/learning/history',
        EXPORT: '/learning/export',
        SYNC: '/learning/sync',
        OFFLINE_DATA: '/learning/offline',
        PROGRESS: '/learning/progress',
        RECOMMENDATIONS: '/learning/recommendations',
        BOOKMARK: '/learning/bookmark'
    },

    // 목표 관리
    GOALS: {
        LIST: '/goals',
        CREATE: '/goals/create',
        UPDATE: '/goals/:id',
        DELETE: '/goals/:id',
        PROGRESS: '/goals/:id/progress',
        STATISTICS: '/goals/statistics',
        TEMPLATES: '/goals/templates',
        SHARE: '/goals/:id/share',
        REMINDERS: '/goals/reminders',
        FEEDBACK: '/goals/feedback'
    },

    // 스터디 그룹
    GROUPS: {
        LIST: '/groups',
        CREATE: '/groups/create',
        UPDATE: '/groups/:id',
        DELETE: '/groups/:id',
        MEMBERS: '/groups/:id/members',
        INVITE: '/groups/:id/invite',
        JOIN: '/groups/:id/join',
        LEAVE: '/groups/:id/leave',
        POSTS: '/groups/:id/posts',
        SCHEDULES: '/groups/:id/schedules',
        RESOURCES: '/groups/:id/resources',
        PROGRESS: '/groups/:id/progress',
        STATISTICS: '/groups/:id/statistics'
    },

    // 알림
    NOTIFICATIONS: {
        LIST: '/notifications',
        READ: '/notifications/:id/read',
        DELETE: '/notifications/:id',
        SETTINGS: '/notifications/settings',
        MARK_ALL_READ: '/notifications/mark-all-read',
        SUBSCRIBE: '/notifications/subscribe',
        UNSUBSCRIBE: '/notifications/unsubscribe'
    },

    // 프로필
    PROFILE: {
        INFO: '/profile',
        UPDATE: '/profile/update',
        SETTINGS: '/profile/settings',
        PREFERENCES: '/profile/preferences',
        AVATAR: '/profile/avatar',
        THEME: '/profile/theme',
        STATISTICS: '/profile/statistics',
        ACHIEVEMENTS: '/profile/achievements'
    },

    // 파일 관리
    FILES: {
        UPLOAD: '/files/upload',
        DOWNLOAD: '/files/:id',
        DELETE: '/files/:id',
        LIST: '/files',
        SHARE: '/files/:id/share'
    },

    // 통계 및 분석
    ANALYTICS: {
        DASHBOARD: '/analytics/dashboard',
        LEARNING: '/analytics/learning',
        GOALS: '/analytics/goals',
        GROUPS: '/analytics/groups',
        EXPORT: '/analytics/export',
        REPORTS: '/analytics/reports'
    }
};

// HTTP 메서드
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH'
};

// API 버전
export const API_VERSION = 'v1';

// 요청 타임아웃 (밀리초)
export const REQUEST_TIMEOUT = 10000;

// 캐시 만료 시간 (밀리초)
export const CACHE_EXPIRY = {
    SHORT: 5 * 60 * 1000,      // 5분
    MEDIUM: 30 * 60 * 1000,    // 30분
    LONG: 24 * 60 * 60 * 1000  // 24시간
};

// 파일 업로드 제한
export const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024,  // 50MB
    ALLOWED_TYPES: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.ms-excel'],
    MAX_FILES: 10
};

export default API_ENDPOINTS;
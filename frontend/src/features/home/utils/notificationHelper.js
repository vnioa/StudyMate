// features/home/utils/notificationHelper.js

/**
 * 알림 관리를 위한 유틸리티 함수들
 */

// 알림 타입 상수
export const NOTIFICATION_TYPES = {
    GOAL: 'goal',                    // 목표 관련
    ACHIEVEMENT: 'achievement',       // 성취 관련
    GROUP: 'group',                  // 그룹 관련
    STUDY: 'study',                  // 학습 관련
    REMINDER: 'reminder',            // 리마인더
    SYSTEM: 'system'                 // 시스템 알림
};

// 알림 우선순위 상수
export const PRIORITY_LEVELS = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

/**
 * 알림 메시지 생성
 * @param {string} type - 알림 타입
 * @param {Object} data - 알림 데이터
 * @returns {Object} 알림 객체
 */
export const createNotification = (type, data) => {
    const baseNotification = {
        id: generateNotificationId(),
        type,
        timestamp: new Date().toISOString(),
        isRead: false
    };

    switch (type) {
        case NOTIFICATION_TYPES.GOAL:
            return {
                ...baseNotification,
                title: '목표 알림',
                message: generateGoalMessage(data),
                priority: PRIORITY_LEVELS.HIGH,
                icon: 'target',
                data
            };

        case NOTIFICATION_TYPES.ACHIEVEMENT:
            return {
                ...baseNotification,
                title: '성취 알림',
                message: generateAchievementMessage(data),
                priority: PRIORITY_LEVELS.HIGH,
                icon: 'trophy',
                data
            };

        case NOTIFICATION_TYPES.GROUP:
            return {
                ...baseNotification,
                title: '그룹 알림',
                message: generateGroupMessage(data),
                priority: PRIORITY_LEVELS.MEDIUM,
                icon: 'group',
                data
            };

        case NOTIFICATION_TYPES.STUDY:
            return {
                ...baseNotification,
                title: '학습 알림',
                message: generateStudyMessage(data),
                priority: PRIORITY_LEVELS.MEDIUM,
                icon: 'book',
                data
            };

        case NOTIFICATION_TYPES.REMINDER:
            return {
                ...baseNotification,
                title: '리마인더',
                message: generateReminderMessage(data),
                priority: PRIORITY_LEVELS.LOW,
                icon: 'bell',
                data
            };

        default:
            return {
                ...baseNotification,
                title: '시스템 알림',
                message: data.message,
                priority: PRIORITY_LEVELS.LOW,
                icon: 'info',
                data
            };
    }
};

/**
 * 알림 메시지 생성 - 목표
 * @param {Object} data - 목표 데이터
 * @returns {string} 알림 메시지
 */
const generateGoalMessage = (data) => {
    const { type, progress, goalName } = data;

    switch (type) {
        case 'completion':
            return `축하합니다! "${goalName}" 목표를 달성했습니다.`;
        case 'progress':
            return `"${goalName}" 목표의 ${progress}%를 달성했습니다.`;
        case 'reminder':
            return `"${goalName}" 목표의 마감이 다가오고 있습니다.`;
        default:
            return `"${goalName}" 목표가 업데이트되었습니다.`;
    }
};

/**
 * 알림 메시지 생성 - 성취
 * @param {Object} data - 성취 데이터
 * @returns {string} 알림 메시지
 */
const generateAchievementMessage = (data) => {
    const { type, achievementName, badgeName } = data;

    switch (type) {
        case 'badge':
            return `새로운 배지 "${badgeName}"를 획득했습니다!`;
        case 'level':
            return `축하합니다! 새로운 레벨에 도달했습니다.`;
        case 'milestone':
            return `"${achievementName}" 마일스톤을 달성했습니다!`;
        default:
            return `새로운 성취를 달성했습니다.`;
    }
};

/**
 * 알림 메시지 생성 - 그룹
 * @param {Object} data - 그룹 데이터
 * @returns {string} 알림 메시지
 */
const generateGroupMessage = (data) => {
    const { type, groupName, userName } = data;

    switch (type) {
        case 'invite':
            return `"${groupName}" 그룹에서 초대를 보냈습니다.`;
        case 'join':
            return `${userName}님이 "${groupName}" 그룹에 참여했습니다.`;
        case 'activity':
            return `"${groupName}" 그룹에 새로운 활동이 있습니다.`;
        default:
            return `"${groupName}" 그룹 알림이 있습니다.`;
    }
};

/**
 * 알림 메시지 생성 - 학습
 * @param {Object} data - 학습 데이터
 * @returns {string} 알림 메시지
 */
const generateStudyMessage = (data) => {
    const { type, studyName, progress } = data;

    switch (type) {
        case 'start':
            return `"${studyName}" 학습을 시작했습니다.`;
        case 'progress':
            return `"${studyName}" 학습 진도 ${progress}%를 달성했습니다.`;
        case 'complete':
            return `"${studyName}" 학습을 완료했습니다!`;
        default:
            return `"${studyName}" 학습 알림이 있습니다.`;
    }
};

/**
 * 알림 메시지 생성 - 리마인더
 * @param {Object} data - 리마인더 데이터
 * @returns {string} 알림 메시지
 */
const generateReminderMessage = (data) => {
    const { type, taskName, dueDate } = data;

    switch (type) {
        case 'upcoming':
            return `"${taskName}" 일정이 곧 시작됩니다.`;
        case 'due':
            return `"${taskName}" 마감 기한이 ${dueDate}입니다.`;
        case 'overdue':
            return `"${taskName}" 마감 기한이 지났습니다.`;
        default:
            return `"${taskName}" 관련 리마인더입니다.`;
    }
};

/**
 * 알림 ID 생성
 * @returns {string} 유니크한 알림 ID
 */
const generateNotificationId = () => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 알림 우선순위 설정
 * @param {string} type - 알림 타입
 * @param {Object} data - 알림 데이터
 * @returns {string} 우선순위
 */
export const getNotificationPriority = (type, data) => {
    switch (type) {
        case NOTIFICATION_TYPES.GOAL:
        case NOTIFICATION_TYPES.ACHIEVEMENT:
            return data.isUrgent ? PRIORITY_LEVELS.HIGH : PRIORITY_LEVELS.MEDIUM;
        case NOTIFICATION_TYPES.GROUP:
        case NOTIFICATION_TYPES.STUDY:
            return PRIORITY_LEVELS.MEDIUM;
        default:
            return PRIORITY_LEVELS.LOW;
    }
};

export default {
    createNotification,
    getNotificationPriority,
    NOTIFICATION_TYPES,
    PRIORITY_LEVELS
};
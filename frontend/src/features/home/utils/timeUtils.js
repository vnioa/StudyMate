// features/home/utils/timeUtils.js

/**
 * 시간대별 메시지를 생성하는 유틸리티 함수들
 */

// 시간대별 메시지 상수
const TIME_MESSAGES = {
    DAWN: {
        start: 0,
        end: 5,
        messages: [
            '늦은 시간까지 열심히 공부하시네요!',
            '충분한 휴식도 중요해요.',
            '잠시 쉬어가는 것은 어떨까요?'
        ]
    },
    MORNING: {
        start: 5,
        end: 12,
        messages: [
            '좋은 아침입니다! 오늘도 힘찬 하루 시작해볼까요?',
            '상쾌한 아침, 오늘의 목표를 확인해보세요.',
            '아침 시간을 효율적으로 활용해보세요!'
        ]
    },
    AFTERNOON: {
        start: 12,
        end: 17,
        messages: [
            '열심히 학습하고 계시네요! 오후도 파이팅하세요!',
            '학습 목표 달성이 순조롭네요.',
            '잠시 휴식을 취하고 다시 시작해보는 건 어떨까요?'
        ]
    },
    EVENING: {
        start: 17,
        end: 22,
        messages: [
            '하루를 마무리하는 시간, 오늘의 목표를 점검해볼까요?',
            '오늘 하루도 수고하셨어요!',
            '목표 달성까지 얼마나 남았는지 확인해보세요.'
        ]
    },
    NIGHT: {
        start: 22,
        end: 24,
        messages: [
            '늦은 시간까지 열심히 공부하시네요!',
            '내일을 위해 적절한 휴식도 필요해요.',
            '오늘의 성과를 정리해보는 건 어떨까요?'
        ]
    }
};

/**
 * 현재 시간에 따른 메시지를 반환하는 함수
 * @returns {string} 시간대별 메시지
 */
export const getTimeBasedMessage = () => {
    const hour = new Date().getHours();
    const timeSlot = getTimeSlot(hour);
    return getRandomMessage(timeSlot);
};

/**
 * 시간대를 반환하는 함수
 * @param {number} hour - 현재 시간 (0-23)
 * @returns {object} 해당 시간대의 메시지 객체
 */
const getTimeSlot = (hour) => {
    if (hour >= TIME_MESSAGES.DAWN.start && hour < TIME_MESSAGES.DAWN.end) {
        return TIME_MESSAGES.DAWN;
    } else if (hour >= TIME_MESSAGES.MORNING.start && hour < TIME_MESSAGES.MORNING.end) {
        return TIME_MESSAGES.MORNING;
    } else if (hour >= TIME_MESSAGES.AFTERNOON.start && hour < TIME_MESSAGES.AFTERNOON.end) {
        return TIME_MESSAGES.AFTERNOON;
    } else if (hour >= TIME_MESSAGES.EVENING.start && hour < TIME_MESSAGES.EVENING.end) {
        return TIME_MESSAGES.EVENING;
    } else {
        return TIME_MESSAGES.NIGHT;
    }
};

/**
 * 해당 시간대의 메시지 중 랜덤한 메시지를 반환하는 함수
 * @param {object} timeSlot - 시간대 객체
 * @returns {string} 랜덤 메시지
 */
const getRandomMessage = (timeSlot) => {
    const randomIndex = Math.floor(Math.random() * timeSlot.messages.length);
    return timeSlot.messages[randomIndex];
};

/**
 * 날짜를 포맷팅하는 함수
 * @param {Date} date - 날짜 객체
 * @returns {string} 포맷팅된 날짜 문자열 (예: "2024년 3월 15일")
 */
export const formatDate = (date) => {
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * 시간을 포맷팅하는 함수
 * @param {Date} date - 날짜 객체
 * @returns {string} 포맷팅된 시간 문자열 (예: "오후 3:30")
 */
export const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

/**
 * 학습 시간을 계산하는 함수
 * @param {number} minutes - 학습한 시간(분)
 * @returns {string} 포맷팅된 학습 시간 문자열
 */
export const formatStudyTime = (minutes) => {
    if (minutes < 60) {
        return `${minutes}분`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}시간`;
    }

    return `${hours}시간 ${remainingMinutes}분`;
};

/**
 * 남은 시간을 계산하는 함수
 * @param {Date} endDate - 종료 날짜
 * @returns {string} 남은 시간 문자열
 */
export const getRemainingTime = (endDate) => {
    const now = new Date();
    const diff = endDate - now;

    if (diff <= 0) {
        return '종료됨';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days}일 ${hours}시간`;
    } else if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
    } else {
        return `${minutes}분`;
    }
};

export default {
    getTimeBasedMessage,
    formatDate,
    formatTime,
    formatStudyTime,
    getRemainingTime
};
// features/social/utils/messageUtils.js
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

const messageUtils = {
    // 메시지 타입
    MESSAGE_TYPES: {
        TEXT: 'text',
        IMAGE: 'image',
        FILE: 'file',
        VIDEO: 'video',
        AUDIO: 'audio',
        SYSTEM: 'system'
    },

    // 메시지 상태
    MESSAGE_STATUS: {
        SENDING: 'sending',
        SENT: 'sent',
        DELIVERED: 'delivered',
        READ: 'read',
        FAILED: 'failed'
    },

    // 메시지 시간 포맷팅
    formatMessageTime: (timestamp, format = 'simple') => {
        const date = new Date(timestamp);

        switch (format) {
            case 'full':
                return messageUtils.formatFullTime(date);
            case 'date':
                return messageUtils.formatDateOnly(date);
            case 'simple':
            default:
                return messageUtils.formatSimpleTime(date);
        }
    },

    // 간단한 시간 포맷
    formatSimpleTime: (date) => {
        return format(date, 'HH:mm');
    },

    // 전체 시간 포맷
    formatFullTime: (date) => {
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return '어제 ' + format(date, 'HH:mm');
        } else if (isThisWeek(date)) {
            return format(date, 'EEEE HH:mm', { locale: ko });
        } else {
            return format(date, 'yyyy.MM.dd HH:mm');
        }
    },

    // 날짜만 포맷
    formatDateOnly: (date) => {
        if (isToday(date)) {
            return '오늘';
        } else if (isYesterday(date)) {
            return '어제';
        } else if (isThisWeek(date)) {
            return format(date, 'EEEE', { locale: ko });
        } else {
            return format(date, 'yyyy년 M월 d일');
        }
    },

    // 메시지 유효성 검사
    validateMessage: (message) => {
        if (!message) {
            throw new Error('메시지가 비어있습니다.');
        }

        if (!message.chatId) {
            throw new Error('채팅방 ID가 필요합니다.');
        }

        if (message.type === messageUtils.MESSAGE_TYPES.TEXT && !message.content?.trim()) {
            throw new Error('메시지 내용이 비어있습니다.');
        }

        return true;
    },

    // 메시지 미리보기 생성
    createPreview: (message, maxLength = 30) => {
        if (!message) return '';

        switch (message.type) {
            case messageUtils.MESSAGE_TYPES.TEXT:
                const content = message.content.trim();
                return content.length > maxLength
                    ? `${content.slice(0, maxLength)}...`
                    : content;
            case messageUtils.MESSAGE_TYPES.IMAGE:
                return '사진';
            case messageUtils.MESSAGE_TYPES.FILE:
                return '파일';
            case messageUtils.MESSAGE_TYPES.VIDEO:
                return '동영상';
            case messageUtils.MESSAGE_TYPES.AUDIO:
                return '음성 메시지';
            case messageUtils.MESSAGE_TYPES.SYSTEM:
                return message.content;
            default:
                return '';
        }
    },

    // 메시지 그룹화 (날짜별)
    groupMessagesByDate: (messages) => {
        return messages.reduce((groups, message) => {
            const date = messageUtils.formatDateOnly(new Date(message.timestamp));

            if (!groups[date]) {
                groups[date] = [];
            }

            groups[date].push(message);
            return groups;
        }, {});
    },

    // 연속된 메시지 확인
    isConsecutiveMessage: (currentMessage, previousMessage, timeThreshold = 60000) => {
        if (!previousMessage) return false;
        if (currentMessage.userId !== previousMessage.userId) return false;

        const timeDiff = new Date(currentMessage.timestamp) - new Date(previousMessage.timestamp);
        return timeDiff < timeThreshold;
    },

    // 메시지 상태 텍스트
    getStatusText: (status) => {
        switch (status) {
            case messageUtils.MESSAGE_STATUS.SENDING:
                return '전송 중';
            case messageUtils.MESSAGE_STATUS.SENT:
                return '전송됨';
            case messageUtils.MESSAGE_STATUS.DELIVERED:
                return '전달됨';
            case messageUtils.MESSAGE_STATUS.READ:
                return '읽음';
            case messageUtils.MESSAGE_STATUS.FAILED:
                return '전송 실패';
            default:
                return '';
        }
    },

    // 메시지 정렬
    sortMessages: (messages) => {
        return [...messages].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );
    },

    // 읽지 않은 메시지 수 계산
    countUnreadMessages: (messages, lastReadTimestamp) => {
        if (!lastReadTimestamp) return messages.length;

        return messages.filter(message =>
            new Date(message.timestamp) > new Date(lastReadTimestamp)
        ).length;
    },

    // 시스템 메시지 생성
    createSystemMessage: (content) => ({
        id: Date.now().toString(),
        type: messageUtils.MESSAGE_TYPES.SYSTEM,
        content,
        timestamp: new Date().toISOString(),
        system: true
    })
};

export default messageUtils;
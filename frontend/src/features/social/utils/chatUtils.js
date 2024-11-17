// features/social/utils/chatUtils.js
import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { ko } from 'date-fns/locale';

const chatUtils = {
    // 메시지 시간 포맷팅
    formatMessageTime: (timestamp) => {
        const date = new Date(timestamp);

        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return '어제';
        } else if (isThisWeek(date)) {
            return format(date, 'EEEE', { locale: ko });
        } else if (isThisYear(date)) {
            return format(date, 'M월 d일');
        } else {
            return format(date, 'yyyy년 M월 d일');
        }
    },

    // 채팅방 마지막 메시지 포맷팅
    formatLastMessage: (message) => {
        if (!message) return '';

        switch (message.type) {
            case 'text':
                return message.content;
            case 'image':
                return '사진';
            case 'file':
                return '파일';
            case 'video':
                return '동영상';
            case 'audio':
                return '음성 메시지';
            case 'system':
                return message.content;
            default:
                return '';
        }
    },

    // 읽지 않은 메시지 수 포맷팅
    formatUnreadCount: (count) => {
        if (!count) return '';
        if (count > 99) return '99+';
        return count.toString();
    },

    // 참가자 목록 포맷팅
    formatParticipants: (participants, currentUserId) => {
        if (!participants?.length) return '';

        const others = participants.filter(p => p.id !== currentUserId);
        if (others.length === 0) return '나';
        if (others.length === 1) return others[0].name;
        return `${others[0].name} 외 ${others.length - 1}명`;
    },

    // 채팅방 제목 생성
    generateChatTitle: (chat, currentUserId) => {
        if (chat.type === 'group' && chat.title) {
            return chat.title;
        }
        return chatUtils.formatParticipants(chat.participants, currentUserId);
    },

    // 메시지 그룹화 (날짜별)
    groupMessagesByDate: (messages) => {
        const groups = {};

        messages.forEach(message => {
            const date = new Date(message.timestamp);
            const key = format(date, 'yyyy-MM-dd');

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(message);
        });

        return Object.entries(groups).map(([date, messages]) => ({
            date,
            messages
        }));
    },

    // 연속된 메시지 확인
    isConsecutiveMessage: (currentMessage, previousMessage) => {
        if (!previousMessage) return false;
        if (currentMessage.userId !== previousMessage.userId) return false;

        const timeDiff = new Date(currentMessage.timestamp) - new Date(previousMessage.timestamp);
        return timeDiff < 60000; // 1분 이내
    },

    // 메시지 상태 텍스트
    getMessageStatusText: (message) => {
        if (message.error) return '전송 실패';
        if (message.sending) return '전송 중';
        if (message.sent && !message.delivered) return '전송됨';
        if (message.delivered && !message.read) return '읽지 않음';
        if (message.read) return '읽음';
        return '';
    },

    // 채팅방 미리보기 텍스트
    getChatPreview: (chat) => {
        const lastMessage = chat.lastMessage;
        if (!lastMessage) return '';

        const preview = chatUtils.formatLastMessage(lastMessage);
        return preview.length > 30 ? `${preview.slice(0, 30)}...` : preview;
    },

    // 채팅방 정렬
    sortChats: (chats) => {
        return [...chats].sort((a, b) => {
            const timeA = a.lastMessage?.timestamp || a.updatedAt;
            const timeB = b.lastMessage?.timestamp || b.updatedAt;
            return new Date(timeB) - new Date(timeA);
        });
    },

    // 메시지 검증
    validateMessage: (message) => {
        if (!message.content && message.type === 'text') {
            throw new Error('메시지 내용이 비어있습니다.');
        }
        if (!message.chatId) {
            throw new Error('채팅방 ID가 필요합니다.');
        }
        return true;
    },

    // 채팅방 타입 확인
    isChatType: {
        direct: (chat) => chat.type === 'direct',
        group: (chat) => chat.type === 'group',
        broadcast: (chat) => chat.type === 'broadcast'
    }
};

export default chatUtils;
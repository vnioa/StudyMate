// features/social/utils/validationUtils.js
const validationUtils = {
    // 이메일 검증
    validateEmail: (email) => {
        if (!email) {
            throw new Error('이메일을 입력해주세요.');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('유효하지 않은 이메일 형식입니다.');
        }
        return true;
    },

    // 비밀번호 검증
    validatePassword: (password) => {
        if (!password) {
            throw new Error('비밀번호를 입력해주세요.');
        }
        if (password.length < 8) {
            throw new Error('비밀번호는 8자 이상이어야 합니다.');
        }
        if (!/[A-Z]/.test(password)) {
            throw new Error('비밀번호에 대문자가 포함되어야 합니다.');
        }
        if (!/[a-z]/.test(password)) {
            throw new Error('비밀번호에 소문자가 포함되어야 합니다.');
        }
        if (!/[0-9]/.test(password)) {
            throw new Error('비밀번호에 숫자가 포함되어야 합니다.');
        }
        if (!/[!@#$%^&*]/.test(password)) {
            throw new Error('비밀번호에 특수문자가 포함되어야 합니다.');
        }
        return true;
    },

    // 사용자 이름 검증
    validateUsername: (username) => {
        if (!username) {
            throw new Error('사용자 이름을 입력해주세요.');
        }
        if (username.length < 2 || username.length > 20) {
            throw new Error('사용자 이름은 2-20자 사이여야 합니다.');
        }
        if (!/^[가-힣a-zA-Z0-9]+$/.test(username)) {
            throw new Error('사용자 이름은 한글, 영문, 숫자만 사용 가능합니다.');
        }
        return true;
    },

    // 검색어 검증
    validateSearchQuery: (query) => {
        if (!query || query.trim().length === 0) {
            throw new Error('검색어를 입력해주세요.');
        }
        if (query.length > 100) {
            throw new Error('검색어는 100자를 초과할 수 없습니다.');
        }
        return true;
    },

    // 채팅방 ID 검증
    validateChatId: (chatId) => {
        if (!chatId) {
            throw new Error('채팅방 ID가 필요합니다.');
        }
        return true;
    },

    // 메시지 ID 검증
    validateMessageId: (messageId) => {
        if (!messageId) {
            throw new Error('메시지 ID가 필요합니다.');
        }
        return true;
    },

    // 사용자 ID 검증
    validateUserId: (userId) => {
        if (!userId) {
            throw new Error('사용자 ID가 필요합니다.');
        }
        return true;
    },

    // 메시지 내용 검증
    validateMessageContent: (content) => {
        if (!content || content.trim().length === 0) {
            throw new Error('메시지 내용을 입력해주세요.');
        }
        if (content.length > 2000) {
            throw new Error('메시지는 2000자를 초과할 수 없습니다.');
        }
        return true;
    },

    // 파일 검증
    validateFile: (file) => {
        if (!file) {
            throw new Error('파일이 필요합니다.');
        }
        if (file.size > 100 * 1024 * 1024) { // 100MB
            throw new Error('파일 크기는 100MB를 초과할 수 없습니다.');
        }
        return true;
    },

    // 리액션 검증
    validateReaction: (reaction) => {
        const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
        if (!validReactions.includes(reaction)) {
            throw new Error('유효하지 않은 리액션입니다.');
        }
        return true;
    },

    // 상태 메시지 검증
    validateStatus: (status) => {
        const validStatuses = ['online', 'away', 'busy', 'offline'];
        if (!validStatuses.includes(status)) {
            throw new Error('유효하지 않은 상태입니다.');
        }
        return true;
    },

    // 친구 목록 검증
    validateFriendIds: (friendIds) => {
        if (!Array.isArray(friendIds)) {
            throw new Error('친구 목록이 배열 형식이어야 합니다.');
        }
        if (friendIds.some(id => !id)) {
            throw new Error('유효하지 않은 친구 ID가 포함되어 있습니다.');
        }
        return true;
    },

    // 채팅방 제목 검증
    validateChatTitle: (title) => {
        if (!title || title.trim().length === 0) {
            throw new Error('채팅방 제목을 입력해주세요.');
        }
        if (title.length > 50) {
            throw new Error('채팅방 제목은 50자를 초과할 수 없습니다.');
        }
        return true;
    },

    // 알림 설정 검증
    validateNotificationSettings: (settings) => {
        const validTypes = ['all', 'mentions', 'none'];
        if (!validTypes.includes(settings.type)) {
            throw new Error('유효하지 않은 알림 설정입니다.');
        }
        return true;
    }
};

export default validationUtils;
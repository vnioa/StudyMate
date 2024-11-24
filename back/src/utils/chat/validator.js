class ChatValidator {
    // 메시지 유효성 검사
    validateMessage(content, type) {
        if (!content || !type) {
            throw new Error('메시지 내용과 타입은 필수입니다.');
        }

        switch (type) {
            case 'text':
                return this.validateTextMessage(content);
            case 'file':
                return this.validateFileMessage(content);
            default:
                throw new Error('지원하지 않는 메시지 타입입니다.');
        }
    }

    // 텍스트 메시지 유효성 검사
    validateTextMessage(content) {
        if (typeof content !== 'string') {
            throw new Error('텍스트 메시지는 문자열이어야 합니다.');
        }

        if (content.length > 1000) {
            throw new Error('메시지는 1000자를 초과할 수 없습니다.');
        }

        if (content.trim().length === 0) {
            throw new Error('빈 메시지는 전송할 수 없습니다.');
        }

        return true;
    }

    // 파일 메시지 유효성 검사
    validateFileMessage(file) {
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        const ALLOWED_TYPES = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!file) {
            throw new Error('파일이 첨부되지 않았습니다.');
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error('파일 크기는 100MB를 초과할 수 없습니다.');
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error('지원하지 않는 파일 형식입니다.');
        }

        return true;
    }

    // 채팅방 생성 유효성 검사
    validateRoomCreation(roomData) {
        const { name, type, participants } = roomData;

        if (!name || !type || !participants) {
            throw new Error('채팅방 이름, 타입, 참여자는 필수입니다.');
        }

        if (name.length > 50) {
            throw new Error('채팅방 이름은 50자를 초과할 수 없습니다.');
        }

        if (!['direct', 'group'].includes(type)) {
            throw new Error('잘못된 채팅방 타입입니다.');
        }

        if (type === 'group' && participants.length < 2) {
            throw new Error('그룹 채팅방은 최소 2명의 참여자가 필요합니다.');
        }

        return true;
    }

    // 채팅방 설정 유효성 검사
    validateRoomSettings(settings) {
        const { notification, theme } = settings;

        if (typeof notification !== 'boolean') {
            throw new Error('알림 설정은 boolean 타입이어야 합니다.');
        }

        if (!['default', 'dark', 'light'].includes(theme)) {
            throw new Error('지원하지 않는 테마입니다.');
        }

        return true;
    }
}

module.exports = new ChatValidator();
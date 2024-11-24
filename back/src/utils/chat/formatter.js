class ChatFormatter {
    // 메시지 시간 포맷팅
    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 메시지 날짜 포맷팅
    formatMessageDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    // 메시지 내용 포맷팅
    formatMessageContent(content, type) {
        switch(type) {
            case 'text':
                return this.formatTextContent(content);
            case 'file':
                return this.formatFileContent(content);
            case 'system':
                return this.formatSystemContent(content);
            default:
                return content;
        }
    }

    // 텍스트 메시지 포맷팅
    formatTextContent(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    }

    // 파일 메시지 포맷팅
    formatFileContent(content) {
        const { fileName, fileSize, fileType } = JSON.parse(content);
        return `${fileName} (${this.formatFileSize(fileSize)})`;
    }

    // 시스템 메시지 포맷팅
    formatSystemContent(content) {
        return `<i>${content}</i>`;
    }

    // 참여자 목록 포맷팅
    formatParticipantsList(participants) {
        return participants.map(p => ({
            id: p.userId,
            name: p.name,
            status: p.status,
            lastSeen: this.formatMessageTime(p.lastSeen)
        }));
    }

    // 메시지 미리보기 포맷팅
    formatMessagePreview(message) {
        const MAX_LENGTH = 30;
        let preview = message.content;

        if (message.type === 'file') {
            const fileData = JSON.parse(message.content);
            preview = `📎 ${fileData.fileName}`;
        }

        if (preview.length > MAX_LENGTH) {
            preview = preview.substring(0, MAX_LENGTH) + '...';
        }

        return preview;
    }
}

module.exports = new ChatFormatter();
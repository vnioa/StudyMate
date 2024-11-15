// constants/messages.js
export const MESSAGES = {
    // 성공 메시지
    SUCCESS: {
        SAVE: '성공적으로 저장되었습니다.',
        UPDATE: '성공적으로 업데이트되었습니다.',
        DELETE: '성공적으로 삭제되었습니다.',
        UPLOAD: '파일이 업로드되었습니다.',
        LOGIN: '로그인되었습니다.',
        REGISTER: '회원가입이 완료되었습니다.'
    },

    // 에러 메시지
    ERROR: {
        DEFAULT: '오류가 발생했습니다. 다시 시도해주세요.',
        NETWORK: '네트워크 연결을 확인해주세요.',
        AUTH: '인증에 실패했습니다.',
        VALIDATION: '입력값을 확인해주세요.',
        SERVER: '서버 오류가 발생했습니다.',
        TIMEOUT: '요청 시간이 초과되었습니다.'
    },

    // 확인 메시지
    CONFIRM: {
        DELETE: '정말 삭제하시겠습니까?',
        LOGOUT: '로그아웃 하시겠습니까?',
        CANCEL: '진행 중인 작업이 있습니다. 취소하시겠습니까?'
    },

    // 알림 메시지
    NOTIFICATION: {
        NEW_MESSAGE: '새로운 메시지가 있습니다.',
        GOAL_ACHIEVED: '목표를 달성했습니다!',
        REMINDER: '학습 시간입니다.',
        UPDATE_AVAILABLE: '새로운 업데이트가 있습니다.'
    }
};
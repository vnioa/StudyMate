import APIClient from './ApiClient';

// 아이디 중복 확인
export const checkUsername = async (username) => {
    return APIClient.post('/api/users/check-username', { username });
};

// 이메일 인증 코드 요청
export const requestVerificationCode = async (email) => {
    return APIClient.post('/api/users/send-verification-code', { email });
};

// 이메일 인증 코드 검증
export const verifyCode = async (code) => {
    return APIClient.post('/api/users/verify-code', { code });
};

// 회원가입 요청
export const registerUser = async (userData) => {
    return APIClient.post('/api/users/register', userData);
};

// 로그인 요청
export const loginUser = async(username, password) => {
    return APIClient.post('/api/users/login', { username, password });
}

// 토큰 검증 API 호출
export const validateToken = async (token) => {
    return APIClient.post('/api/users/validate-token', { token });
}

// 아이디 찾기 요청
export const findId = async (name, email) => {
    return APIClient.post('/api/users/find-id', { name, email });
};

// 비밀번호 찾기 인증 코드 요청
export const requestVerificationCodeForPassword = async (username, email) => {
    return APIClient.post('/api/users/send-verification-code', { username, email });
};

// 비밀번호 재설정 API 호출
export const resetPassword = async (username, newPassword) => {
    return APIClient().post('api/users/reset-password', { username, newPassword });
};
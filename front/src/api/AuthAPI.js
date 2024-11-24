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
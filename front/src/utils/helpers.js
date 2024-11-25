const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 날짜 포맷팅 헬퍼
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 파일 크기 포맷팅
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 비밀번호 유효성 검사
const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
        isValid: password.length >= minLength && hasNumber && hasUpper && hasLower && hasSpecial,
        message: password.length < minLength ? '비밀번호는 8자 이상이어야 합니다.' :
            !hasNumber ? '숫자를 포함해야 합니다.' :
                !hasUpper ? '대문자를 포함해야 합니다.' :
                    !hasLower ? '소문자를 포함해야 합니다.' :
                        !hasSpecial ? '특수문자를 포함해야 합니다.' : '유효한 비밀번호입니다.'
    };
};

// 이메일 유효성 검사
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 전화번호 포맷팅
const formatPhoneNumber = (phoneNumber) => {
    return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
};

// JWT 토큰 생성
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// 비밀번호 해시화
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

// 비밀번호 비교
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// 에러 메시지 생성
const createErrorMessage = (error) => {
    return {
        message: error.message || '서버 오류가 발생했습니다.',
        status: error.status || 500,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
};

module.exports = {
    formatDate,
    formatFileSize,
    validatePassword,
    validateEmail,
    formatPhoneNumber,
    generateToken,
    hashPassword,
    comparePassword,
    createErrorMessage
};
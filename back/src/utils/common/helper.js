const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Helper {
    // 비밀번호 해시화
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, 10);
        } catch (error) {
            console.error('비밀번호 해시화 오류:', error);
            throw new Error('비밀번호 해시화에 실패했습니다.');
        }
    }

    // 비밀번호 검증
    async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error('비밀번호 검증 오류:', error);
            throw new Error('비밀번호 검증에 실패했습니다.');
        }
    }

    // JWT 토큰 생성
    generateToken(userId) {
        try {
            return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        } catch (error) {
            console.error('토큰 생성 오류:', error);
            throw new Error('토큰 생성에 실패했습니다.');
        }
    }

    // JWT 토큰 검증
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            console.error('토큰 검증 오류:', error);
            throw new Error('토큰 검증에 실패했습니다.');
        }
    }

    // 인증 코드 생성
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 날짜 포맷팅
    formatDate(date) {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    // 이메일 유효성 검사
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // 전화번호 포맷팅
    formatPhoneNumber(phoneNumber) {
        return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
}

module.exports = new Helper();
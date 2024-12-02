const nodemailer = require('nodemailer');
require('dotenv').config();
const db = require('../../config/mysql');

class EmailService {
    constructor() {
        // SMTP 설정
        this.transporter = nodemailer.createTransport({
            host: 'smtp.naver.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.NAVER_EMAIL,
                pass: process.env.NAVER_PASSWORD
            }
        });
    }

    // 인증 코드 생성
    generateVerificationCode() {
        return Math.floor(1000000 + Math.random() * 9000000).toString();
    }

    // 인증 이메일 전송
    async sendVerificationEmail(email) {
        try {
            const code = this.generateVerificationCode();
    
            // 이전 인증 코드 삭제
            await db.execute('DELETE FROM verification_codes WHERE email = ?', [email]);
    
            await this.transporter.sendMail({
                from: process.env.NAVER_EMAIL,
                to: email,
                subject: 'StudyMate 이메일 인증',
                text: `인증 코드: ${code}`,
                html: `...` // HTML 코드 생략
            });
    
            // 새로운 인증 코드 저장
            await db.execute(
                'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
                [email, code]
            );
    
            return code;
        } catch (error) {
            console.error('이메일 전송 오류:', error);
            throw new Error('이메일 전송에 실패했습니다.');
        }
    }
    // 알림 이메일 전송
    async sendNotificationEmail(email, subject, content) {
        try {
            await this.transporter.sendMail({
                from: process.env.NAVER_EMAIL,
                to: email,
                subject: subject,
                html: `
          <div style="padding: 20px; background-color: #f5f5f5;">
            <h2>${subject}</h2>
            <div>${content}</div>
          </div>
        `
            });
        } catch (error) {
            console.error('알림 이메일 전송 오류:', error);
            throw new Error('알림 이메일 전송에 실패했습니다.');
        }
    }

    // 비밀번호 재설정 이메일 전송
    async sendPasswordResetEmail(email, resetToken) {
        try {
            await this.transporter.sendMail({
                from: process.env.NAVER_EMAIL,
                to: email,
                subject: 'StudyMate 비밀번호 재설정',
                html: `
          <div style="padding: 20px; background-color: #f5f5f5;">
            <h2>비밀번호 재설정</h2>
            <p>아래 링크를 클릭하여 비밀번호를 재설정하세요:</p>
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
               style="padding: 10px 20px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 5px;">
              비밀번호 재설정
            </a>
            <p>이 링크는 1시간 동안 유효합니다.</p>
          </div>
        `
            });
        } catch (error) {
            console.error('비밀번호 재설정 이메일 전송 오류:', error);
            throw new Error('비밀번호 재설정 이메일 전송에 실패했습니다.');
        }
    }

    // 인증 코드 검증
    async verifyCode(email, code) {
        try {
            const [result] = await db.execute(
                'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
                [email, code]
            );

            return result.length > 0;
        } catch (error) {
            console.error('인증 코드 검증 오류:', error);
            throw new Error('인증 코드 검증에 실패했습니다.');
        }
    }
}

module.exports = new EmailService();
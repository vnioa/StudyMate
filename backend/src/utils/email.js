const nodemailer = require('nodemailer');
const { dbUtils } = require('../config/database.config');

// 이메일 템플릿
const emailTemplates = {
    authCode: (code, type, sessionId) => ({
        subject: '[StudyMate] ' + (type === 'password' ? '비밀번호 재설정' : '이메일 인증'),
        html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">
          ${type === 'password' ? '비밀번호 재설정' : '이메일 인증'}
        </h2>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; text-align: center;">
            요청하신 인증 코드는 다음과 같습니다:
          </p>
          <h1 style="text-align: center; color: #0066FF; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </h1>
          <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
            인증 코드는 3분 동안 유효합니다.
          </p>
          ${sessionId ? `<input type="hidden" name="sessionId" value="${sessionId}">` : ''}
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          본 이메일은 발신 전용입니다. 문의사항이 있으시면 고객센터를 이용해 주세요.
        </p>
      </div>
    `
    })
};

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// 인증 코드 생성 함수 (7자리 숫자)
const generateAuthCode = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
};

// 이메일 전송 함수
const sendEmail = async (to, type = 'id', userId = null) => {
    try {
        if (!validateEmail(to)) {
            throw new Error('유효하지 않은 이메일 주소입니다.');
        }

        const authCode = generateAuthCode();
        const sessionId = Math.random().toString(36).substring(2, 15);
        const emailContent = emailTemplates.authCode(authCode, type, sessionId);

        const mailOptions = {
            from: `"StudyMate" <${process.env.EMAIL_USER}>`,
            to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ 이메일 전송 성공:', info.messageId);

        await saveAuthCodeToDB(to, authCode, type, sessionId, userId);

        return {
            success: true,
            sessionId
        };
    } catch (error) {
        console.error('❌ 이메일 전송 실패:', error);
        throw error;
    }
};

// 인증 코드 DB 저장 함수
const saveAuthCodeToDB = async (email, code, type, sessionId, userId = null) => {
    try {
        const query = `
            INSERT INTO auth_codes 
            (email, code, type, session_id, user_id, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            email,
            code,
            type,
            sessionId,
            userId,
            new Date(Date.now() + 3 * 60 * 1000) // 3분 후 만료
        ];

        await dbUtils.query(query, params);
    } catch (error) {
        console.error('❌ 인증 코드 저장 실패:', error);
        throw new Error('인증 코드 저장에 실패했습니다.');
    }
};

// 이메일 유효성 검사
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 인증 코드 검증 함수
const verifyAuthCode = async (email, code, type, sessionId) => {
    try {
        const query = `
            SELECT * FROM auth_codes 
            WHERE email = ? AND code = ? AND type = ? 
            AND session_id = ? AND expires_at > NOW()
        `;
        const rows = await dbUtils.query(query, [email, code, type, sessionId]);

        if (rows.length === 0) {
            throw new Error('유효하지 않거나 만료된 인증 코드입니다.');
        }

        // 사용된 인증 코드 삭제
        await dbUtils.query(
            'DELETE FROM auth_codes WHERE email = ? AND code = ?',
            [email, code]
        );

        return {
            success: true,
            userId: rows[0].user_id
        };
    } catch (error) {
        console.error('❌ 인증 코드 검증 실패:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    validateEmail,
    verifyAuthCode
};
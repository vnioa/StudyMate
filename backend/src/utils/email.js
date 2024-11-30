const nodemailer = require('nodemailer');

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
            인증 코드는 30분 동안 유효합니다.
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
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// 인증 코드 생성 함수
const generateAuthCode = () => {
    return Math.random().toString(36).slice(-6).toUpperCase();
};

// 이메일 전송 함수
const sendEmail = async (to, type = 'id', userId = null) => {
    try {
        const authCode = generateAuthCode();
        const sessionId = Math.random().toString(36).substring(2, 15);
        const emailContent = emailTemplates.authCode(authCode, type, sessionId);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('이메일 전송 성공:', info.messageId);

        // DB에 인증 코드 저장
        await saveAuthCodeToDB(to, authCode, type, sessionId, userId);

        return {
            success: true,
            sessionId
        };
    } catch (error) {
        console.error('이메일 전송 실패:', error);
        throw new Error('이메일 전송에 실패했습니다.');
    }
};

// 인증 코드 DB 저장 함수
const saveAuthCodeToDB = async (email, code, type, sessionId, userId = null) => {
    const connection = await db.getConnection();
    try {
        await connection.query(
            'INSERT INTO auth_codes (email, code, type, session_id, user_id, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
            [email, code, type, sessionId, userId, new Date(Date.now() + 30 * 60 * 1000)]
        );
    } catch (error) {
        throw new Error('인증 코드 저장에 실패했습니다.');
    } finally {
        connection.release();
    }
};

// 이메일 유효성 검사
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 인증 코드 검증 함수
const verifyAuthCode = async (email, code, type, sessionId) => {
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT * FROM auth_codes WHERE email = ? AND code = ? AND type = ? AND session_id = ? AND expires_at > NOW()',
            [email, code, type, sessionId]
        );

        if (rows.length === 0) {
            throw new Error('유효하지 않은 인증 코드입니다.');
        }

        // 사용된 인증 코드 삭제
        await connection.query(
            'DELETE FROM auth_codes WHERE email = ? AND code = ?',
            [email, code]
        );

        return {
            success: true,
            userId: rows[0].user_id
        };
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    sendEmail,
    validateEmail,
    verifyAuthCode
};
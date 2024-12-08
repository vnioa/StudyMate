const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 이름 유효성 검사
const validateName = async (req, res) => {
    const { name } = req.body;
    try {
        const nameRegex = /^[가-힣]{2,10}$/;
        const isValid = nameRegex.test(name);
        res.status(200).json({
            isValid,
            message: isValid ? null : '이름은 2-10자의 한글만 가능합니다.'
        });
    } catch (error) {
        console.error('이름 검증 오류:', error);
        res.status(500).json({ success: false, message: '이름 검증에 실패했습니다.' });
    }
};

// 이름 변경
const updateName = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.user_id;

    try {
        await db.execute('UPDATE users SET name = ? WHERE user_id = ?', [name, userId]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('이름 변경 오류:', error);
        res.status(500).json({ success: false, message: '이름 변경에 실패했습니다.' });
    }
};

// 프로필 조회
const getProfile = async (req, res) => {
    const userId = req.users.user_id;
    try {
        const [user] = await db.execute('SELECT name, email, profile_image FROM users WHERE user_id = ?', [userId]);
        res.status(200).json(user[0]);
    } catch (error) {
        console.error('프로필 조회 오류:', error);
        res.status(500).json({ success: false, message: '프로필 조회에 실패했습니다.' });
    }
};

// 이미지 업로드
const uploadImage = async (req, res) => {
    const { type } = req.params;
    const userId = req.user.user_id;

    if (!req.file) {
        return res.status(400).json({ success: false, message: '파일이 없습니다.' });
    }

    try {
        const imageUrl = `/uploads/${req.file.filename}`;
        const column = type === 'profile' ? 'profile_image' : 'background_image';
        await db.execute(`UPDATE users SET ${column} = ? WHERE user_id = ?`, [imageUrl, userId]);
        res.status(200).json({ success: true, imageUrl });
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        res.status(500).json({ success: false, message: '이미지 업로드에 실패했습니다.' });
    }
};

// 사용자 정보 조회
const getUserInfo = async (req, res) => {
    const userId = req.user.user_id;
    try {
        const [user] = await db.execute(
            'SELECT name, phone_number, birth_date, username, email FROM users WHERE user_id = ?',
            [userId]
        );
        res.status(200).json(user[0]);
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ success: false, message: '사용자 정보 조회에 실패했습니다.' });
    }
};

// 사용자 정보 수정
const updateUserInfo = async (req, res) => {
    const { name, phone_number, birth_date, password } = req.body;
    const userId = req.user.user_id;

    try {
        let updates = [];
        let values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (phone_number) { updates.push('phone_number = ?'); values.push(phone_number); }
        if (birth_date) { updates.push('birth_date = ?'); values.push(birth_date); }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password_hash = ?');
            values.push(hashedPassword);
        }

        values.push(userId);
        await db.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('사용자 정보 수정 오류:', error);
        res.status(500).json({ success: false, message: '사용자 정보 수정에 실패했습니다.' });
    }
};

// 전화번호 유효성 검사
const validatePhone = async (req, res) => {
    const { phone_number } = req.body;
    try {
        const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
        const isValid = phoneRegex.test(phone_number);
        res.status(200).json({
            isValid,
            message: isValid ? null : '올바른 전화번호 형식이 아닙니다.'
        });
    } catch (error) {
        console.error('전화번호 검증 오류:', error);
        res.status(500).json({ success: false, message: '전화번호 검증에 실패했습니다.' });
    }
};

// 비밀번호 변경
const changePassword = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { currentPassword, newPassword } = req.body;

        const [user] = await db.execute(`SELECT password_hash FROM users WHERE user_id = ?`, [userId]);
        if (!user.length || !(await bcrypt.compare(currentPassword, user[0].password_hash))) {
            return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(`UPDATE users SET password_hash = ? WHERE user_id = ?`, [hashedPassword, userId]);

        return res.status(200).json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({ success: false, message: '비밀번호 변경에 실패했습니다.' });
    }
};

// 비밀번호 유효성 검사
const validatePassword = async (req, res) => {
    const { password } = req.body;
    try {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        const isValid = passwordRegex.test(password);
        res.status(200).json({
            isValid,
            message: isValid ? null : '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.',
        });
    } catch (error) {
        console.error('비밀번호 검증 오류:', error);
        res.status(500).json({ success: false, message: '비밀번호 검증에 실패했습니다.' });
    }
};

// 프로필 업데이트
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { name, email, phone_number } = req.body;

        if (!name || !email || !phone_number) {
            return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
        }

        await db.execute(
            `UPDATE users SET name = ?, email = ?, phone_number = ? WHERE user_id = ?`,
            [name, email, phone_number, userId]
        );

        res.status(200).json({ success: true, message: '프로필이 성공적으로 업데이트되었습니다.' });
    } catch (error) {
        console.error('프로필 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '프로필 업데이트에 실패했습니다.' });
    }
};

// 개인정보 설정 업데이트
const updatePrivacy = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { privacy_setting } = req.body;

        if (!privacy_setting) {
            return res.status(400).json({ success: false, message: '설정을 입력해주세요.' });
        }

        await db.execute(
            `INSERT INTO user_settings (user_id, privacy_setting) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE privacy_setting = ?`,
            [userId, privacy_setting, privacy_setting]
        );

        res.status(200).json({ success: true, message: '개인정보 설정이 성공적으로 업데이트되었습니다.' });
    } catch (error) {
        console.error('개인정보 설정 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '개인정보 설정 업데이트에 실패했습니다.' });
    }
};

// 연결된 소셜 계정 목록 가져오기
const getSocialAccounts = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [socialAccounts] = await db.execute(`SELECT * FROM linked_accounts WHERE user_id = ?`, [userId]);

        res.status(200).json({ success: true, data: socialAccounts });
    } catch (error) {
        console.error('소셜 계정 조회 오류:', error);
        res.status(500).json({ success: false, message: '소셜 계정 조회에 실패했습니다.' });
    }
};

// 기본 계정 정보 가져오기
const getPrimaryAccount = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [primaryAccount] = await db.execute(
            `SELECT * FROM linked_accounts WHERE user_id = ? AND is_primary = 1`,
            [userId]
        );

        res.status(200).json({ success: true, data: primaryAccount || null });
    } catch (error) {
        console.error('기본 계정 조회 오류:', error);
        res.status(500).json({ success: false, message: '기본 계정 조회에 실패했습니다.' });
    }
};

// 기본 계정 설정
const setPrimaryAccount = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { account_id } = req.body;

        if (!account_id) {
            return res.status(400).json({ success: false, message: '계정 ID를 입력해주세요.' });
        }

        await db.execute(`UPDATE linked_accounts SET is_primary = 0 WHERE user_id = ?`, [userId]);
        await db.execute(
            `UPDATE linked_accounts SET is_primary = 1 WHERE user_id = ? AND account_id = ?`,
            [userId, account_id]
        );

        res.status(200).json({ success: true, message: '기본 계정이 성공적으로 설정되었습니다.' });
    } catch (error) {
        console.error('기본 계정 설정 오류:', error);
        res.status(500).json({ success: false, message: '기본 계정 설정에 실패했습니다.' });
    }
};

// 소셜 계정 연결 해제
const disconnectSocialAccount = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { account_id } = req.body;

        if (!account_id) {
            return res.status(400).json({ success: false, message: '소셜 계정 ID를 입력해주세요.' });
        }

        await db.execute(`DELETE FROM linked_accounts WHERE user_id = ? AND account_id = ?`, [userId, account_id]);

        res.status(200).json({ success: true, message: '소셜 계정이 성공적으로 해제되었습니다.' });
    } catch (error) {
        console.error('소셜 계정 해제 오류:', error);
        res.status(500).json({ success: false, message: '소셜 계정 해제에 실패했습니다.' });
    }
};

module.exports = {
    validateName,
    updateName,
    getProfile,
    uploadImage,
    getUserInfo,
    updateUserInfo,
    validatePhone,
    changePassword,
    validatePassword,
    updateProfile,
    updatePrivacy,
    getSocialAccounts,
    getPrimaryAccount,
    setPrimaryAccount,
    disconnectSocialAccount,
};

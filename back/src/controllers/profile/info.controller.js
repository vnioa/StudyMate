const db = require('../../config/mysql');

// 사용자 기본 정보 조회
const getUserInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await db.execute(
            'SELECT id, username, name, email, phoneNumber, birthdate, profile_visibility FROM users WHERE id = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({
            success: true,
            user: user[0]
        });
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ success: false, message: '사용자 정보 조회에 실패했습니다.' });
    }
};

// 사용자 기본 정보 수정
const updateUserInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phoneNumber, email } = req.body;

        await db.execute(
            'UPDATE users SET name = ?, phoneNumber = ?, email = ? WHERE id = ?',
            [name, phoneNumber, email, userId]
        );

        res.status(200).json({
            success: true,
            message: '사용자 정보가 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('사용자 정보 수정 오류:', error);
        res.status(500).json({ success: false, message: '사용자 정보 수정에 실패했습니다.' });
    }
};

// 프로필 공개/비공개 설정
const updateProfileVisibility = async (req, res) => {
    try {
        const userId = req.user.id;
        const { isPublic } = req.body;

        await db.execute(
            'UPDATE users SET profile_visibility = ? WHERE id = ?',
            [isPublic, userId]
        );

        res.status(200).json({
            success: true,
            message: `프로필이 ${isPublic ? '공개' : '비공개'}로 설정되었습니다.`
        });
    } catch (error) {
        console.error('프로필 공개 설정 오류:', error);
        res.status(500).json({ success: false, message: '프로필 공개 설정 변경에 실패했습니다.' });
    }
};

// 비밀번호 변경
const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const [user] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);

        if (!(await bcrypt.compare(currentPassword, user[0].password))) {
            return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.status(200).json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        });
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({ success: false, message: '비밀번호 변경에 실패했습니다.' });
    }
};

// 계정 연동 상태 조회
const getSocialConnections = async (req, res) => {
    try {
        const userId = req.user.id;
        const [connections] = await db.execute(
            'SELECT provider, connected_at FROM social_connections WHERE user_id = ?',
            [userId]
        );

        res.status(200).json({
            success: true,
            connections
        });
    } catch (error) {
        console.error('소셜 연동 조회 오류:', error);
        res.status(500).json({ success: false, message: '소셜 연동 정보 조회에 실패했습니다.' });
    }
};

module.exports = {
    getUserInfo,
    updateUserInfo,
    updateProfileVisibility,
    updatePassword,
    getSocialConnections
};
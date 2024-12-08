const db = require('../config/db');

// 내 프로필 조회
const getMyProfile = async (req, res) => {
    try {
        const [profile] = await db.execute(
            'SELECT username, name, email, phone_number, profile_image, status_message FROM users WHERE user_id = ?',
            [req.user.id]
        );

        if (profile.length === 0) {
            return res.status(404).json({
                success: false,
                message: '프로필을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            profile: profile[0]
        });
    } catch (error) {
        console.error('프로필 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '프로필을 불러오는데 실패했습니다.'
        });
    }
};

// 상태 메시지 업데이트
const updateStatus = async (req, res) => {
    const { message } = req.body;
    try {
        await db.execute(
            'UPDATE users SET status_message = ? WHERE user_id = ?',
            [message, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('상태 메시지 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '상태 메시지 업데이트에 실패했습니다.'
        });
    }
};

module.exports = {
    getMyProfile,
    updateStatus
};
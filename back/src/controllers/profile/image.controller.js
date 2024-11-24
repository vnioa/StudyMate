const { upload, deleteFile, STORAGE_PATH } = require('../../config/storage');
const db = require('../../config/mysql');
const path = require('path');

// 프로필 이미지 업로드
const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '이미지가 제공되지 않았습니다.' });
        }

        const userId = req.user.id; // 인증 미들웨어에서 제공된 사용자 ID
        const imagePath = path.join(STORAGE_PATH.PROFILE, req.file.filename);

        // 기존 프로필 이미지가 있다면 삭제
        const [currentImage] = await db.execute('SELECT profile_image FROM users WHERE id = ?', [userId]);
        if (currentImage[0]?.profile_image) {
            await deleteFile(currentImage[0].profile_image);
        }

        // DB에 새 이미지 경로 저장
        await db.execute('UPDATE users SET profile_image = ? WHERE id = ?', [imagePath, userId]);

        res.status(200).json({
            success: true,
            message: '프로필 이미지가 업로드되었습니다.',
            imagePath
        });
    } catch (error) {
        console.error('프로필 이미지 업로드 오류:', error);
        res.status(500).json({ success: false, message: '이미지 업로드에 실패했습니다.' });
    }
};

// 배경 이미지 업로드
const uploadBackgroundImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '이미지가 제공되지 않았습니다.' });
        }

        const userId = req.user.id;
        const imagePath = path.join(STORAGE_PATH.BACKGROUND, req.file.filename);

        // 기존 배경 이미지가 있다면 삭제
        const [currentImage] = await db.execute('SELECT background_image FROM users WHERE id = ?', [userId]);
        if (currentImage[0]?.background_image) {
            await deleteFile(currentImage[0].background_image);
        }

        // DB에 새 이미지 경로 저장
        await db.execute('UPDATE users SET background_image = ? WHERE id = ?', [imagePath, userId]);

        res.status(200).json({
            success: true,
            message: '배경 이미지가 업로드되었습니다.',
            imagePath
        });
    } catch (error) {
        console.error('배경 이미지 업로드 오류:', error);
        res.status(500).json({ success: false, message: '이미지 업로드에 실패했습니다.' });
    }
};

// 프로필 이미지 삭제
const deleteProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await db.execute('SELECT profile_image FROM users WHERE id = ?', [userId]);

        if (user[0]?.profile_image) {
            await deleteFile(user[0].profile_image);
            await db.execute('UPDATE users SET profile_image = NULL WHERE id = ?', [userId]);
        }

        res.status(200).json({ success: true, message: '프로필 이미지가 삭제되었습니다.' });
    } catch (error) {
        console.error('프로필 이미지 삭제 오류:', error);
        res.status(500).json({ success: false, message: '이미지 삭제에 실패했습니다.' });
    }
};

// 배경 이미지 삭제
const deleteBackgroundImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await db.execute('SELECT background_image FROM users WHERE id = ?', [userId]);

        if (user[0]?.background_image) {
            await deleteFile(user[0].background_image);
            await db.execute('UPDATE users SET background_image = NULL WHERE id = ?', [userId]);
        }

        res.status(200).json({ success: true, message: '배경 이미지가 삭제되었습니다.' });
    } catch (error) {
        console.error('배경 이미지 삭제 오류:', error);
        res.status(500).json({ success: false, message: '이미지 삭제에 실패했습니다.' });
    }
};

module.exports = {
    uploadProfileImage,
    uploadBackgroundImage,
    deleteProfileImage,
    deleteBackgroundImage
};
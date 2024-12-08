const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// 디바이스 저장소 경로
const DEVICE_PATH = '/path/to/device/storage'; // 실제 디바이스 저장소 경로로 변경 필요

// 현재 저장소 타입 조회
const getCurrentStorage = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT storage_type FROM user_storage_settings WHERE user_id = ?',
            [req.user.id]
        );

        res.status(200).json({
            type: result[0]?.storage_type || 'device'
        });
    } catch (error) {
        console.error('저장소 타입 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '저장소 타입 조회에 실패했습니다.'
        });
    }
};

// 저장소 통계 조회
const getStorageStats = async (req, res) => {
    try {
        // 디바이스 저장소 파일 크기 계산
        const files = fs.existsSync(DEVICE_PATH) ? fs.readdirSync(DEVICE_PATH) : [];
        const totalSize = files.reduce((size, file) => {
            const stats = fs.statSync(`${DEVICE_PATH}/${file}`);
            return size + stats.size;
        }, 0);

        const [stats] = await db.execute(
            'SELECT last_sync FROM user_storage_stats WHERE user_id = ?',
            [req.user.id]
        );

        res.status(200).json({
            deviceStorage: totalSize,
            lastSync: stats[0]?.last_sync || null
        });
    } catch (error) {
        console.error('저장소 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '저장소 통계 조회에 실패했습니다.'
        });
    }
};

// 저장소 타입 변경
const changeStorageType = async (req, res) => {
    const { type } = req.body;

    try {
        await db.execute(
            'UPDATE user_storage_settings SET storage_type = ? WHERE user_id = ?',
            [type, req.user.id]
        );

        res.status(200).json({
            success: true,
            message: `저장소 타입이 ${type}로 변경되었습니다.`
        });
    } catch (error) {
        console.error('저장소 타입 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '저장소 타입 변경에 실패했습니다.'
        });
    }
};

// 데이터 동기화
const syncData = async (req, res) => {
    try {
        // 디바이스 저장소 파일 크기 계산
        const files = fs.existsSync(DEVICE_PATH) ? fs.readdirSync(DEVICE_PATH) : [];
        const totalSize = files.reduce((size, file) => {
            const stats = fs.statSync(`${DEVICE_PATH}/${file}`);
            return size + stats.size;
        }, 0);

        await db.execute(
            `UPDATE user_storage_stats 
            SET device_storage = ?, last_sync = NOW() 
            WHERE user_id = ?`,
            [totalSize, req.user.id]
        );

        res.status(200).json({ success: true, totalSize });
    } catch (error) {
        console.error('데이터 동기화 오류:', error);
        res.status(500).json({
            success: false,
            message: '데이터 동기화에 실패했습니다.'
        });
    }
};

// 파일 업로드
const uploadFileToDevice = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '파일이 제공되지 않았습니다.'
            });
        }

        const { originalname, buffer } = req.file;
        const filePath = path.join(DEVICE_PATH, originalname);

        // 디바이스에 파일 저장
        if (!fs.existsSync(DEVICE_PATH)) {
            fs.mkdirSync(DEVICE_PATH, { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);

        // 파일 정보 저장
        await db.execute(
            'INSERT INTO user_files (user_id, file_name, file_path, size, created_at) VALUES (?, ?, ?, ?, NOW())',
            [req.user.id, originalname, filePath, buffer.length]
        );

        res.status(200).json({ success: true, filePath });
    } catch (error) {
        console.error('파일 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 업로드에 실패했습니다.'
        });
    }
};

// 파일 목록 조회
const getDeviceFiles = async (req, res) => {
    try {
        const [files] = await db.execute(
            'SELECT file_name, file_path FROM user_files WHERE user_id = ?',
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            files
        });
    } catch (error) {
        console.error('디바이스 파일 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '디바이스 파일 조회에 실패했습니다.'
        });
    }
};

module.exports = {
    getCurrentStorage,
    getStorageStats,
    changeStorageType,
    syncData,
    uploadFileToDevice,
    getDeviceFiles
};

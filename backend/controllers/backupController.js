const db = require('../config/db');

// 마지막 백업 정보 조회
const getLastBackup = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT * FROM backups ORDER BY created_at DESC LIMIT 1'
        );

        if (result.length === 0) {
            return res.status(200).json({
                lastBackup: null
            });
        }

        res.status(200).json({
            lastBackup: {
                date: result[0].created_at
            }
        });
    } catch (error) {
        console.error('마지막 백업 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 백업 상태 조회
const getBackupStatus = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT * FROM backup_status WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );

        if (result.length === 0) {
            return res.status(200).json({
                completed: true,
                progress: 100
            });
        }

        res.status(200).json({
            completed: result[0].completed,
            progress: result[0].progress
        });
    } catch (error) {
        console.error('백업 상태 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 상태를 불러오는데 실패했습니다.'
        });
    }
};

// 새로운 백업 생성
const createBackup = async (req, res) => {
    try {
        const [result] = await db.execute(
            'INSERT INTO backups (user_id, status) VALUES (?, "in_progress")',
            [req.user.id]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({
                success: true,
                backupId: result.insertId
            });
        } else {
            throw new Error('백업 생성 실패');
        }
    } catch (error) {
        console.error('백업 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 생성에 실패했습니다.'
        });
    }
};

// 백업 복원
const restoreFromBackup = async (req, res) => {
    try {
        const [result] = await db.execute(
            'UPDATE backup_status SET status = "restoring" WHERE user_id = ?',
            [req.user.id]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({
                success: true
            });
        } else {
            throw new Error('백업 복원 실패');
        }
    } catch (error) {
        console.error('백업 복원 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 복원에 실패했습니다.'
        });
    }
};

// 백업 설정 조회
const getSettings = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT * FROM backup_settings WHERE user_id = ?',
            [req.user.id]
        );

        if (result.length === 0) {
            return res.status(200).json({
                isAutoBackup: false,
                lastBackupDate: null,
                backupSize: 0,
                backupInterval: 'daily'
            });
        }

        res.status(200).json({
            isAutoBackup: result[0].is_auto_backup,
            lastBackupDate: result[0].last_backup_date,
            backupSize: result[0].backup_size,
            backupInterval: result[0].backup_interval
        });
    } catch (error) {
        console.error('백업 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 설정을 불러오는데 실패했습니다.'
        });
    }
};

// 백업 설정 업데이트
const updateSettings = async (req, res) => {
    const { isAutoBackup, backupInterval } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO backup_settings (user_id, is_auto_backup, backup_interval) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             is_auto_backup = VALUES(is_auto_backup),
             backup_interval = VALUES(backup_interval)`,
            [req.user.id, isAutoBackup, backupInterval]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({
                success: true
            });
        } else {
            throw new Error('백업 설정 업데이트 실패');
        }
    } catch (error) {
        console.error('백업 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 설정 업데이트에 실패했습니다.'
        });
    }
};

module.exports = {
    getLastBackup,
    getBackupStatus,
    createBackup,
    restoreFromBackup,
    getSettings,
    updateSettings
};
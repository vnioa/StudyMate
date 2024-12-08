const db = require('../config/db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// 현재 디스플레이 모드 조회
const getCurrentDisplayMode = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT display_mode FROM user_settings WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json({
            mode: result[0]?.display_mode || 'light'
        });
    } catch (error) {
        console.error('디스플레이 모드 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '디스플레이 모드 조회에 실패했습니다.'
        });
    }
};

// 디스플레이 설정 조회
const getDisplaySettings = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT auto_mode, schedule_start, schedule_end FROM display_settings WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json({
            autoMode: result[0]?.auto_mode || false,
            schedule: {
                start: result[0]?.schedule_start || '22:00',
                end: result[0]?.schedule_end || '06:00'
            }
        });
    } catch (error) {
        console.error('디스플레이 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '디스플레이 설정 조회에 실패했습니다.'
        });
    }
};

// 디스플레이 모드 업데이트
const updateDisplayMode = async (req, res) => {
    const { mode, autoMode, schedule } = req.body;
    try {
        await db.execute(
            'UPDATE user_settings SET display_mode = ? WHERE user_id = ?',
            [mode, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('디스플레이 모드 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '디스플레이 모드 업데이트에 실패했습니다.'
        });
    }
};

// 디스플레이 설정 업데이트
const updateDisplaySettings = async (req, res) => {
    const { autoMode, schedule } = req.body;
    try {
        await db.execute(
            'UPDATE display_settings SET auto_mode = ?, schedule_start = ?, schedule_end = ? WHERE user_id = ?',
            [autoMode, schedule.start, schedule.end, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('디스플레이 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '디스플레이 설정 업데이트에 실패했습니다.'
        });
    }
};

// 글꼴 설정 조회
const getFontSettings = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT font_size, preview_text FROM font_settings WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json({
            fontSize: result[0]?.font_size || 16,
        });
    } catch (error) {
        console.error('글꼴 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '글꼴 설정 조회에 실패했습니다.'
        });
    }
};

// 글꼴 설정 업데이트
const updateFontSettings = async (req, res) => {
    const { fontSize, applyGlobally } = req.body;
    try {
        await db.execute(
            'UPDATE font_settings SET font_size = ? WHERE user_id = ?',
            [fontSize, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('글꼴 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '글꼴 설정 업데이트에 실패했습니다.'
        });
    }
};

// 일반 설정 조회
const getSettings = async (req, res) => {
    try {
        const [settings] = await db.execute(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json({ settings: settings[0] });
    } catch (error) {
        console.error('설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '설정 조회에 실패했습니다.'
        });
    }
};

// 알림 권한 요청
const requestNotificationPermission = async (req, res) => {
    try {
        const { userId } = req.user;
        await db.execute(
            'UPDATE user_settings SET notification_permission = ? WHERE user_id = ?',
            [true, userId]
        );
        res.status(200).json({ granted: true });
    } catch (error) {
        console.error('알림 권한 요청 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 권한 요청에 실패했습니다.'
        });
    }
};

// 알림 설정 업데이트
const updateNotificationSettings = async (req, res) => {
    const { pushEnabled, emailEnabled, soundEnabled } = req.body;
    try {
        await db.execute(
            'UPDATE notification_settings SET push_enabled = ?, email_enabled = ?, sound_enabled = ? WHERE user_id = ?',
            [pushEnabled, emailEnabled, soundEnabled, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('알림 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정 업데이트에 실패했습니다.'
        });
    }
};

// 개인정보 설정 조회
const getPrivacySettings = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT is_public, allow_messages, show_activity, show_progress FROM privacy_settings WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json(result[0] || {
            isPublic: false,
            allowMessages: true,
            showActivity: true,
            showProgress: true
        });
    } catch (error) {
        console.error('개인정보 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '개인정보 설정 조회에 실패했습니다.'
        });
    }
};

// 개인정보 설정 업데이트
const updatePrivacySettings = async (req, res) => {
    const { isPublic, allowMessages, showActivity, showProgress } = req.body;
    try {
        await db.execute(
            'UPDATE privacy_settings SET is_public = ?, allow_messages = ?, show_activity = ?, show_progress = ? WHERE user_id = ?',
            [isPublic, allowMessages, showActivity, showProgress, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('개인정보 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '개인정보 설정 업데이트에 실패했습니다.'
        });
    }
};

// 시스템 설정 열기
const openSystemSettings = async (req, res) => {
    try {
        const { userId } = req.user;
        const [settings] = await db.execute(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [userId]
        );

        if (settings.length === 0) {
            throw new Error('설정을 찾을 수 없습니다.');
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('시스템 설정 열기 오류:', error);
        res.status(500).json({
            success: false,
            message: '시스템 설정을 열 수 없습니다.'
        });
    }
};

// 백업 설정 조회
const getBackupSettings = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT auto_backup, last_backup_date, backup_location, backup_size, backup_interval FROM backup_settings WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json(result[0] || {
            autoBackup: false,
            lastBackupDate: null,
            backupLocation: 'local',
            backupSize: 0,
            backupInterval: 'daily'
        });
    } catch (error) {
        console.error('백업 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 설정 조회에 실패했습니다.'
        });
    }
};

// 자동 백업 설정 업데이트
const updateAutoBackup = async (req, res) => {
    const { enabled, interval } = req.body;
    try {
        await db.execute(
            'UPDATE backup_settings SET auto_backup = ?, backup_interval = ? WHERE user_id = ?',
            [enabled, interval, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('자동 백업 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '자동 백업 설정 업데이트에 실패했습니다.'
        });
    }
};

// 백업 생성
const backupSettings = async (req, res) => {
    try {
        const { userId } = req.user;
        const backupDir = path.join(__dirname, '../backups');

        // 백업 디렉토리 생성
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // 사용자 데이터 조회
        const tables = ['user_settings', 'study_sessions', 'goals', 'notes'];
        const backupData = {};

        for (const table of tables) {
            const [rows] = await db.execute(
                `SELECT * FROM ${table} WHERE user_id = ?`,
                [userId]
            );
            backupData[table] = rows;
        }

        // 백업 파일 생성
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup_${userId}_${timestamp}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        const backupSize = fs.statSync(backupPath).size;

        // 백업 정보 저장
        await db.execute(
            'INSERT INTO backups (user_id, file_path, size, created_at) VALUES (?, ?, ?, NOW())',
            [userId, backupPath, backupSize]
        );

        res.status(200).json({
            success: true,
            backupSize
        });
    } catch (error) {
        console.error('백업 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 생성에 실패했습니다.'
        });
    }
};

// 백업 복원
const restoreSettings = async (req, res) => {
    try {
        const { userId } = req.user;

        // 최신 백업 파일 조회
        const [backup] = await db.execute(
            'SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (backup.length === 0) {
            throw new Error('복원할 백업을 찾을 수 없습니다.');
        }

        const backupData = JSON.parse(fs.readFileSync(backup[0].file_path, 'utf8'));

        // 트랜잭션 시작
        await db.beginTransaction();

        try {
            for (const [table, data] of Object.entries(backupData)) {
                // 기존 데이터 삭제
                await db.execute(
                    `DELETE FROM ${table} WHERE user_id = ?`,
                    [userId]
                );

                // 백업 데이터 복원
                for (const row of data) {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row);
                    const placeholders = values.map(() => '?').join(', ');

                    await db.execute(
                        `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
                        values
                    );
                }
            }

            await db.commit();
            res.status(200).json({ success: true });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('백업 복원 오류:', error);
        res.status(500).json({
            success: false,
            message: '백업 복원에 실패했습니다.'
        });
    }
};

// 설정 업데이트
const updateSettings = async (req, res) => {
    try {
        const entries = Object.entries(req.body);
        await Promise.all(entries.map(([key, value]) =>
            db.execute(
                'UPDATE user_settings SET ?? = ? WHERE user_id = ?',
                [key, value, req.user.id]
            )
        ));
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '설정 업데이트에 실패했습니다.'
        });
    }
};

// 로그아웃
const logout = async (req, res) => {
    try {
        const { userId } = req.user;
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new Error('토큰이 제공되지 않았습니다.');
        }

        // 토큰 블랙리스트에 추가
        await db.execute(
            'INSERT INTO token_blacklist (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
            [token, userId]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('로그아웃 오류:', error);
        res.status(500).json({
            success: false,
            message: '로그아웃에 실패했습니다.'
        });
    }
};

// 계정 삭제
const deleteAccount = async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM users WHERE user_id = ?',
            [req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('계정 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '계정 삭제에 실패했습니다.'
        });
    }
};

// 시간 설정 조회
const getTimeSettings = async (req, res) => {
    const { title } = req.params;
    try {
        const [result] = await db.execute(
            'SELECT start_time, end_time, enabled, days FROM time_settings WHERE user_id = ? AND title = ?',
            [req.user.id, title]
        );
        res.status(200).json(result[0] || {
            startTime: '09:00',
            endTime: '18:00',
            enabled: true,
            days: ['월', '화', '수', '목', '금']
        });
    } catch (error) {
        console.error('시간 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '시간 설정 조회에 실패했습니다.'
        });
    }
};

// 시간 설정 업데이트
const updateTimeSettings = async (req, res) => {
    const { title } = req.params;
    const { startTime, endTime, enabled, days } = req.body;
    try {
        await db.execute(
            'UPDATE time_settings SET start_time = ?, end_time = ?, enabled = ?, days = ? WHERE user_id = ? AND title = ?',
            [startTime, endTime, enabled, JSON.stringify(days), req.user.id, title]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('시간 설정 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '시간 설정 업데이트에 실패했습니다.'
        });
    }
};

// 알림 설정 조회
const getNotificationSettings = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT push_enabled, email_enabled, sound_enabled FROM notification_settings WHERE user_id = ?',
            [req.user.id]
        );

        if (result.length === 0) {
            return res.status(200).json({
                notifications: {
                    pushEnabled: true,
                    emailEnabled: true,
                    soundEnabled: true
                }
            });
        }

        res.status(200).json({
            notifications: {
                pushEnabled: result[0].push_enabled,
                emailEnabled: result[0].email_enabled,
                soundEnabled: result[0].sound_enabled
            }
        });
    } catch (error) {
        console.error('알림 설정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 설정을 불러오는데 실패했습니다.'
        });
    }
};

module.exports = {
    getCurrentDisplayMode,
    getDisplaySettings,
    updateDisplayMode,
    updateDisplaySettings,
    getFontSettings,
    updateFontSettings,
    getSettings,
    getNotificationSettings,
    updateNotificationSettings,
    requestNotificationPermission,
    getPrivacySettings,
    updatePrivacySettings,
    openSystemSettings,
    getBackupSettings,
    updateAutoBackup,
    backupSettings,
    restoreSettings,
    updateSettings,
    logout,
    deleteAccount,
    getTimeSettings,
    updateTimeSettings
};
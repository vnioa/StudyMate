const db = require('../../config/mysql');
const fs = require('fs').promises;
const path = require('path');

class BackupController {
    // 사용자 데이터 백업
    async createBackup(req, res) {
        try {
            const userId = req.user.id;
            const timestamp = new Date().toISOString();

            // 사용자 데이터 수집
            const [userData] = await db.execute(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            const [settings] = await db.execute(
                'SELECT * FROM user_settings WHERE user_id = ?',
                [userId]
            );

            const [studyData] = await db.execute(
                'SELECT * FROM study_sessions WHERE user_id = ?',
                [userId]
            );

            // 백업 데이터 생성
            const backupData = {
                userData: userData[0],
                settings: settings[0],
                studyData,
                timestamp
            };

            // 백업 데이터 저장
            const backupPath = path.join('backups', `${userId}_${timestamp}.json`);
            await fs.writeFile(backupPath, JSON.stringify(backupData));

            // 백업 기록 저장
            await db.execute(
                'INSERT INTO backups (user_id, backup_path, created_at) VALUES (?, ?, ?)',
                [userId, backupPath, timestamp]
            );

            res.status(200).json({
                success: true,
                message: '백업이 성공적으로 생성되었습니다.',
                timestamp
            });
        } catch (error) {
            console.error('백업 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 생성에 실패했습니다.'
            });
        }
    }

    // 백업 목록 조회
    async getBackupList(req, res) {
        try {
            const userId = req.user.id;
            const [backups] = await db.execute(
                'SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            res.status(200).json({
                success: true,
                backups
            });
        } catch (error) {
            console.error('백업 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 목록 조회에 실패했습니다.'
            });
        }
    }

    // 백업 복원
    async restoreBackup(req, res) {
        try {
            const userId = req.user.id;
            const { backupId } = req.params;

            // 백업 파일 정보 조회
            const [backup] = await db.execute(
                'SELECT * FROM backups WHERE id = ? AND user_id = ?',
                [backupId, userId]
            );

            if (backup.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '백업을 찾을 수 없습니다.'
                });
            }

            // 백업 파일 읽기
            const backupData = JSON.parse(
                await fs.readFile(backup[0].backup_path, 'utf8')
            );

            // 트랜잭션 시작
            await db.beginTransaction();

            try {
                // 사용자 설정 복원
                await db.execute(
                    'UPDATE user_settings SET ? WHERE user_id = ?',
                    [backupData.settings, userId]
                );

                // 학습 데이터 복원
                await db.execute(
                    'DELETE FROM study_sessions WHERE user_id = ?',
                    [userId]
                );

                if (backupData.studyData.length > 0) {
                    const studyValues = backupData.studyData.map(session =>
                        [userId, session.title, session.duration, session.created_at]
                    );

                    await db.execute(
                        'INSERT INTO study_sessions (user_id, title, duration, created_at) VALUES ?',
                        [studyValues]
                    );
                }

                await db.commit();

                res.status(200).json({
                    success: true,
                    message: '백업이 성공적으로 복원되었습니다.'
                });
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
    }

    // 백업 삭제
    async deleteBackup(req, res) {
        try {
            const userId = req.user.id;
            const { backupId } = req.params;

            const [backup] = await db.execute(
                'SELECT * FROM backups WHERE id = ? AND user_id = ?',
                [backupId, userId]
            );

            if (backup.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '백업을 찾을 수 없습니다.'
                });
            }

            // 백업 파일 삭제
            await fs.unlink(backup[0].backup_path);

            // DB에서 백업 기록 삭제
            await db.execute(
                'DELETE FROM backups WHERE id = ?',
                [backupId]
            );

            res.status(200).json({
                success: true,
                message: '백업이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            console.error('백업 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 삭제에 실패했습니다.'
            });
        }
    }
}

module.exports = new BackupController();
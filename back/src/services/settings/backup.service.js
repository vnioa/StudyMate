const fs = require('fs').promises;
const path = require('path');
const db = require('../config/mysql');

class BackupService {
    constructor() {
        this.backupPath = 'backups';
        this.createBackupDirectory();
    }

    // 백업 디렉토리 생성
    async createBackupDirectory() {
        try {
            await fs.mkdir(this.backupPath, { recursive: true });
        } catch (error) {
            console.error('백업 디렉토리 생성 오류:', error);
        }
    }

    // 백업 생성
    async createBackup(userId) {
        try {
            const timestamp = new Date().toISOString();
            const backupFileName = `backup_${userId}_${timestamp}.json`;
            const backupFilePath = path.join(this.backupPath, backupFileName);

            // 사용자 데이터 수집
            const [userData] = await db.execute(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            const [userSettings] = await db.execute(
                'SELECT * FROM user_settings WHERE user_id = ?',
                [userId]
            );

            const [studyData] = await db.execute(
                'SELECT * FROM study_sessions WHERE user_id = ?',
                [userId]
            );

            const backupData = {
                timestamp,
                userData: userData[0],
                settings: userSettings[0],
                studyData
            };

            // 백업 파일 생성
            await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));

            // 백업 기록 저장
            await db.execute(
                'INSERT INTO backups (user_id, file_path, created_at) VALUES (?, ?, ?)',
                [userId, backupFilePath, timestamp]
            );

            return {
                success: true,
                backupPath: backupFilePath,
                timestamp
            };
        } catch (error) {
            console.error('백업 생성 오류:', error);
            throw new Error('백업 생성에 실패했습니다.');
        }
    }

    // 백업 복원
    async restoreBackup(userId, backupId) {
        try {
            // 백업 파일 정보 조회
            const [backup] = await db.execute(
                'SELECT * FROM backups WHERE id = ? AND user_id = ?',
                [backupId, userId]
            );

            if (backup.length === 0) {
                throw new Error('백업을 찾을 수 없습니다.');
            }

            // 백업 파일 읽기
            const backupData = JSON.parse(
                await fs.readFile(backup[0].file_path, 'utf8')
            );

            // 트랜잭션 시작
            await db.beginTransaction();

            try {
                // 사용자 설정 복원
                if (backupData.settings) {
                    await db.execute(
                        'UPDATE user_settings SET ? WHERE user_id = ?',
                        [backupData.settings, userId]
                    );
                }

                // 학습 데이터 복원
                if (backupData.studyData) {
                    await db.execute(
                        'DELETE FROM study_sessions WHERE user_id = ?',
                        [userId]
                    );

                    for (const session of backupData.studyData) {
                        await db.execute(
                            'INSERT INTO study_sessions SET ?',
                            [{ ...session, user_id: userId }]
                        );
                    }
                }

                await db.commit();
                return { success: true };
            } catch (error) {
                await db.rollback();
                throw error;
            }
        } catch (error) {
            console.error('백업 복원 오류:', error);
            throw new Error('백업 복원에 실패했습니다.');
        }
    }

    // 백업 목록 조회
    async getBackupList(userId) {
        try {
            const [backups] = await db.execute(
                'SELECT * FROM backups WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            return backups;
        } catch (error) {
            console.error('백업 목록 조회 오류:', error);
            throw new Error('백업 목록 조회에 실패했습니다.');
        }
    }

    // 백업 삭제
    async deleteBackup(userId, backupId) {
        try {
            const [backup] = await db.execute(
                'SELECT * FROM backups WHERE id = ? AND user_id = ?',
                [backupId, userId]
            );

            if (backup.length === 0) {
                throw new Error('백업을 찾을 수 없습니다.');
            }

            // 백업 파일 삭제
            await fs.unlink(backup[0].file_path);

            // DB에서 백업 기록 삭제
            await db.execute(
                'DELETE FROM backups WHERE id = ?',
                [backupId]
            );

            return { success: true };
        } catch (error) {
            console.error('백업 삭제 오류:', error);
            throw new Error('백업 삭제에 실패했습니다.');
        }
    }
}

module.exports = new BackupService();
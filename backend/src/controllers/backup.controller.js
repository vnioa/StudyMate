const db = require('../config/mysql');
const createError = require('http-errors');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;

const BackupController = {
    // 마지막 백업 정보 조회
    getLastBackup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [backup] = await connection.query(
                'SELECT created_at as date FROM backups WHERE status = "completed" ORDER BY created_at DESC LIMIT 1'
            );

            res.json({
                lastBackup: backup.length ? { date: backup[0].date } : null
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 백업 상태 조회
    getBackupStatus: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [backup] = await connection.query(
                'SELECT status, progress FROM backups WHERE status = "in_progress" ORDER BY created_at DESC LIMIT 1'
            );

            if (!backup.length) {
                return res.json({ completed: true });
            }

            res.json({
                completed: backup[0].status === 'completed',
                progress: backup[0].progress
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 새로운 백업 생성
    createBackup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            // 이미 진행 중인 백업이 있는지 확인
            const [inProgress] = await connection.query(
                'SELECT id FROM backups WHERE status = "in_progress"'
            );

            if (inProgress.length) {
                throw createError(409, '이미 진행 중인 백업이 있습니다.');
            }

            // 새로운 백업 레코드 생성
            const [result] = await connection.query(
                'INSERT INTO backups (status, created_by) VALUES ("in_progress", ?)',
                [req.user.id]
            );

            const backupId = result.insertId;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(process.env.BACKUP_DIR, timestamp);

            // 비동기로 백업 프로세스 시작
            this.performBackup(backupId, backupDir).catch(console.error);

            res.json({
                success: true,
                backupId: backupId.toString()
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 백업 복원
    restoreFromBackup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            // 최신 완료된 백업 찾기
            const [backup] = await connection.query(
                'SELECT id, file_path FROM backups WHERE status = "completed" ORDER BY created_at DESC LIMIT 1'
            );

            if (!backup.length) {
                throw createError(404, '복원할 백업을 찾을 수 없습니다.');
            }

            // 복원 프로세스 시작
            await this.performRestore(backup[0].file_path);

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 백업 설정 조회
    getSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            // 백업 설정 조회
            const [settings] = await connection.query(
                'SELECT * FROM backup_settings WHERE user_id = ?',
                [req.user.id]
            );

            // 백업 히스토리 조회
            const [history] = await connection.query(
                `SELECT id, created_at, status, file_size as size, error_message 
         FROM backups 
         ORDER BY created_at DESC 
         LIMIT 10`
            );

            res.json({
                isAutoBackup: settings[0]?.is_auto_backup || false,
                lastBackupDate: settings[0]?.last_backup_date,
                backupSize: settings[0]?.backup_size || 0,
                backupInterval: settings[0]?.backup_interval || 'daily',
                backupHistory: history
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 백업 설정 업데이트
    updateSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { isAutoBackup, backupInterval } = req.body;

            await connection.query(
                `INSERT INTO backup_settings (user_id, is_auto_backup, backup_interval)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
         is_auto_backup = VALUES(is_auto_backup),
         backup_interval = VALUES(backup_interval)`,
                [req.user.id, isAutoBackup, backupInterval]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 실제 백업 수행 (내부 메서드)
    performBackup: async (backupId, backupDir) => {
        const connection = await db.getConnection();
        try {
            // 백업 디렉토리 생성
            await fs.mkdir(backupDir, { recursive: true });

            // MySQL 덤프 명령어 실행
            const dumpFile = path.join(backupDir, 'database.sql');
            await execAsync(
                `mysqldump -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${dumpFile}`
            );

            // 파일 크기 계산
            const stats = await fs.stat(dumpFile);

            // 백업 상태 업데이트
            await connection.query(
                `UPDATE backups 
         SET status = "completed", 
             file_path = ?,
             file_size = ?,
             completed_at = NOW()
         WHERE id = ?`,
                [dumpFile, stats.size, backupId]
            );
        } catch (error) {
            // 에러 발생 시 상태 업데이트
            await connection.query(
                'UPDATE backups SET status = "failed", error_message = ? WHERE id = ?',
                [error.message, backupId]
            );
            throw error;
        } finally {
            connection.release();
        }
    },

    // 백업 복원 수행 (내부 메서드)
    performRestore: async (backupFile) => {
        try {
            await execAsync(
                `mysql -u${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} < ${backupFile}`
            );
            return true;
        } catch (error) {
            console.error('복원 실패:', error);
            throw createError(500, '백업 복원에 실패했습니다.');
        }
    }
};

module.exports = BackupController;
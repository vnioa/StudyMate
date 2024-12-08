const { dbUtils } = require('../config/database.config');

const backupService = {
    // 마지막 백업 정보 조회
    async getLastBackup() {
        try {
            const query = `
                SELECT b.*, bh.action, bh.status as historyStatus, bh.errorMessage,
                       u.username as performedByUsername
                FROM backups b
                LEFT JOIN backup_history bh ON b.id = bh.backupId
                LEFT JOIN auth u ON bh.performedBy = u.id
                WHERE b.status = 'completed'
                ORDER BY b.date DESC
                LIMIT 1
            `;

            const [lastBackup] = await dbUtils.query(query);
            return lastBackup;
        } catch (error) {
            throw new Error('마지막 백업 정보 조회 실패: ' + error.message);
        }
    },

    // 백업 상태 조회
    async getBackupStatus() {
        try {
            const query = `
                SELECT status,
                       COUNT(*) as count,
                       MAX(date) as lastDate,
                       SUM(size) as totalSize
                FROM backups
                GROUP BY status
            `;

            const status = await dbUtils.query(query);
            return status;
        } catch (error) {
            throw new Error('백업 상태 조회 실패: ' + error.message);
        }
    },

    // 새로운 백업 생성
    async createBackup(backupData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const backupPath = `/backups/${Date.now()}_${backupData.type}.${backupData.compressionType}`;

                const [result] = await connection.query(`
                    INSERT INTO backups (
                        date, type, compressionType, status, filePath, description
                    ) VALUES (
                        NOW(), ?, ?, 'in_progress', ?, ?
                    )
                `, [
                    backupData.type,
                    backupData.compressionType,
                    backupPath,
                    backupData.description
                ]);

                await connection.query(`
                    INSERT INTO backup_history (
                        backupId, action, status, performedBy
                    ) VALUES (?, 'create', 'success', ?)
                `, [result.insertId, backupData.performedBy]);

                return {
                    id: result.insertId,
                    filePath: backupPath
                };
            } catch (error) {
                throw new Error('백업 생성 실패: ' + error.message);
            }
        });
    },

    // 백업 복원
    async restoreFromBackup(backupId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [backup] = await connection.query(
                    'SELECT * FROM backups WHERE id = ? AND status = "completed"',
                    [backupId]
                );

                if (!backup) {
                    throw new Error('유효한 백업을 찾을 수 없습니다.');
                }

                await connection.query(`
                    INSERT INTO backup_history (
                        backupId, action, status, performedBy
                    ) VALUES (?, 'restore', 'success', ?)
                `, [backupId, userId]);

                return { success: true };
            } catch (error) {
                throw new Error('백업 복원 실패: ' + error.message);
            }
        });
    },

    // 백업 설정 조회
    async getBackupSettings() {
        try {
            const query = `
                SELECT bs.*, u.username as updatedByUsername
                FROM backup_settings bs
                LEFT JOIN auth u ON bs.updatedBy = u.id
                ORDER BY bs.updatedAt DESC
                LIMIT 1
            `;

            const [settings] = await dbUtils.query(query);
            return settings || {
                isAutoBackup: false,
                backupInterval: 24
            };
        } catch (error) {
            throw new Error('백업 설정 조회 실패: ' + error.message);
        }
    },

    // 백업 설정 업데이트
    async updateBackupSettings(settingsData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO backup_settings (
                        isAutoBackup, backupInterval, updatedBy
                    ) VALUES (?, ?, ?)
                `, [
                    settingsData.isAutoBackup,
                    settingsData.backupInterval,
                    settingsData.updatedBy
                ]);

                return {
                    id: result.insertId,
                    ...settingsData
                };
            } catch (error) {
                throw new Error('백업 설정 업데이트 실패: ' + error.message);
            }
        });
    },

    // 백업 진행률 업데이트
    async updateBackupProgress(backupId, progress) {
        try {
            await dbUtils.query(`
                UPDATE backups
                SET progress = ?,
                    status = CASE
                        WHEN ? = 100 THEN 'completed'
                        WHEN ? < 100 THEN 'in_progress'
                        ELSE status
                    END
                WHERE id = ?
            `, [progress, progress, progress, backupId]);

            return { success: true };
        } catch (error) {
            throw new Error('백업 진행률 업데이트 실패: ' + error.message);
        }
    }
};

module.exports = backupService;
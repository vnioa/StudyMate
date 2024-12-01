const { dbUtils } = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

const backupService = {
    // 마지막 백업 정보 조회
    async getLastBackup() {
        try {
            const query = `
                SELECT * FROM backups
                WHERE status = 'completed'
                ORDER BY date DESC
                    LIMIT 1
            `;
            const lastBackup = await dbUtils.query(query);

            return {
                lastBackup: lastBackup[0] || null
            };
        } catch (error) {
            throw new Error('마지막 백업 정보 조회 실패: ' + error.message);
        }
    },

    // 백업 상태 조회
    async getBackupStatus() {
        try {
            const query = `
                SELECT * FROM backups
                WHERE status IN ('pending', 'in_progress')
                ORDER BY date DESC
                    LIMIT 1
            `;
            const currentBackup = await dbUtils.query(query);

            return {
                completed: !currentBackup[0],
                progress: currentBackup[0]?.progress || 0
            };
        } catch (error) {
            throw new Error('백업 상태 조회 실패: ' + error.message);
        }
    },

    // 새로운 백업 생성
    async createBackup() {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 백업 레코드 생성
                const [result] = await connection.query(`
                    INSERT INTO backups (
                        status, filePath, description
                    ) VALUES (?, ?, ?)
                `, ['in_progress', '', '자동 백업']);

                const backupId = result.insertId;
                const backupPath = path.join(process.env.BACKUP_DIR, `backup_${backupId}.zip`);

                // 백업 히스토리 생성
                await connection.query(`
                    INSERT INTO backup_history (
                        backupId, action, status, performedBy
                    ) VALUES (?, ?, ?, ?)
                `, [backupId, 'create', 'success', req.user.id]);

                // 백업 설정 업데이트
                await connection.query(`
                    UPDATE backup_settings
                    SET lastBackupDate = NOW()
                    WHERE id = ?
                `, [1]);

                return {
                    success: true,
                    backupId
                };
            } catch (error) {
                throw new Error('백업 생성 실패: ' + error.message);
            }
        });
    },

    // 백업 복원
    async restoreFromBackup() {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [lastBackup] = await connection.query(`
                    SELECT * FROM backups
                    WHERE status = 'completed'
                    ORDER BY date DESC
                        LIMIT 1
                `);

                if (!lastBackup) {
                    throw new Error('복원할 백업을 찾을 수 없습니다');
                }

                // 백업 히스토리 생성
                await connection.query(`
                    INSERT INTO backup_history (
                        backupId, action, status, performedBy
                    ) VALUES (?, ?, ?, ?)
                `, [lastBackup.id, 'restore', 'success', req.user.id]);

                return { success: true };
            } catch (error) {
                throw new Error('백업 복원 실패: ' + error.message);
            }
        });
    },

    // 백업 설정 조회
    async getSettings() {
        try {
            const query = `
                SELECT bs.*,
                       b.date as lastBackupDate,
                       b.size as backupSize
                FROM backup_settings bs
                         LEFT JOIN backups b ON b.id = (
                    SELECT id FROM backups
                    WHERE status = 'completed'
                    ORDER BY date DESC
                    LIMIT 1
                    )
            `;
            const settings = await dbUtils.query(query);

            return settings[0];
        } catch (error) {
            throw new Error('백업 설정 조회 실패: ' + error.message);
        }
    },

    // 백업 설정 업데이트
    async updateSettings(data) {
        try {
            await dbUtils.query(`
                UPDATE backup_settings
                SET isAutoBackup = ?,
                    backupInterval = ?
                WHERE id = ?
            `, [data.isAutoBackup, data.backupInterval, 1]);

            return { success: true };
        } catch (error) {
            throw new Error('백업 설정 업데이트 실패: ' + error.message);
        }
    }
};

module.exports = backupService;
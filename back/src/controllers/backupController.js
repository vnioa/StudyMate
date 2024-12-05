const db = require('../config/db');

// 유틸리티 함수
const utils = {
    async executeQuery(query, params) {
        try {
            const [results] = await db.execute(query, params);
            return results;
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error('데이터베이스 쿼리 실행 실패');
        }
    },

    async executeTransaction(callback) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
};

const backupController = {
    // 마지막 백업 정보 조회
    getLastBackup: async (req, res) => {
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

            const lastBackup = await utils.executeQuery(query);

            if (!lastBackup.length) {
                return res.status(404).json({
                    success: false,
                    message: '백업 정보가 존재하지 않습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '마지막 백업 정보를 성공적으로 조회했습니다.',
                data: lastBackup[0]
            });
        } catch (error) {
            console.error('백업 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 정보 조회에 실패했습니다.'
            });
        }
    },

    // 백업 상태 조회
    getBackupStatus: async (req, res) => {
        try {
            const query = `
        SELECT status,
               COUNT(*) as count,
               MAX(date) as lastDate,
               SUM(size) as totalSize
        FROM backups
        GROUP BY status
      `;

            const status = await utils.executeQuery(query);

            res.status(200).json({
                success: true,
                message: '백업 상태를 성공적으로 조회했습니다.',
                data: status
            });
        } catch (error) {
            console.error('백업 상태 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 상태 조회에 실패했습니다.'
            });
        }
    },

    // 새로운 백업 생성
    createBackup: async (req, res) => {
        try {
            const userId = req.user.id;
            const { type, compressionType, description } = req.body;
            const backupPath = `/backups/${Date.now()}_${type}.${compressionType}`;

            const result = await utils.executeTransaction(async (connection) => {
                const [backup] = await connection.execute(`
          INSERT INTO backups (date, type, compressionType, status, filePath, description)
          VALUES (NOW(), ?, ?, 'in_progress', ?, ?)
        `, [type, compressionType, backupPath, description]);

                await connection.execute(`
          INSERT INTO backup_history (backupId, action, status, performedBy)
          VALUES (?, 'create', 'success', ?)
        `, [backup.insertId, userId]);

                return {
                    id: backup.insertId,
                    filePath: backupPath
                };
            });

            res.status(201).json({
                success: true,
                message: '백업이 성공적으로 생성되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('백업 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 생성에 실패했습니다.'
            });
        }
    },

    // 나머지 메서드들도 같은 패턴으로 구현...
    restoreFromBackup: async (req, res) => {
        try {
            const userId = req.user.id;
            const { backupId } = req.body;

            if (!backupId) {
                return res.status(400).json({
                    success: false,
                    message: '백업 ID가 필요합니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const [backup] = await connection.execute(
                    'SELECT * FROM backups WHERE id = ? AND status = "completed"',
                    [backupId]
                );

                if (!backup.length) {
                    throw new Error('유효한 백업을 찾을 수 없습니다.');
                }

                await connection.execute(`
          INSERT INTO backup_history (backupId, action, status, performedBy)
          VALUES (?, 'restore', 'success', ?)
        `, [backupId, userId]);

                return { success: true };
            });

            res.status(200).json({
                success: true,
                message: '백업 복원이 시작되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('백업 복원 오류:', error);
            res.status(500).json({
                success: false,
                message: '백업 복원에 실패했습니다.'
            });
        }
    }
};

module.exports = backupController;
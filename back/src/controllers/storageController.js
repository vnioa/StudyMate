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
    },

    validateStorageType(type) {
        const validTypes = ['local', 'cloud', 'hybrid'];
        return validTypes.includes(type);
    },

    validateSyncType(type) {
        const validTypes = ['manual', 'auto', 'scheduled'];
        return validTypes.includes(type);
    }
};

const storageController = {
    // 현재 저장소 타입 조회
    getCurrentStorage: async (req, res) => {
        try {
            const userId = req.user.id;

            const [storage] = await utils.executeQuery(`
        SELECT storageType, cloudStorageUsed, deviceStorageUsed, 
               lastSyncAt, autoSync, syncInterval
        FROM storage_settings
        WHERE memberId = ?
      `, [userId]);

            if (!storage) {
                return res.status(404).json({
                    success: false,
                    message: '저장소 설정을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '현재 저장소 정보를 성공적으로 조회했습니다.',
                data: storage
            });
        } catch (error) {
            console.error('저장소 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '저장소 정보 조회에 실패했습니다.'
            });
        }
    },

    // 저장소 통계 조회
    getStorageStats: async (req, res) => {
        try {
            const userId = req.user.id;

            const [stats] = await utils.executeQuery(`
        SELECT 
          storageType,
          cloudStorageUsed,
          deviceStorageUsed,
          maxCloudStorage,
          maxDeviceStorage,
          (SELECT COUNT(*) FROM storage_syncs 
           WHERE memberId = ? AND status = 'completed') as totalSyncs,
          (SELECT COUNT(*) FROM storage_usage_logs 
           WHERE memberId = ? AND action = 'add') as totalFiles
        FROM storage_settings
        WHERE memberId = ?
      `, [userId, userId, userId]);

            res.status(200).json({
                success: true,
                message: '저장소 통계를 성공적으로 조회했습니다.',
                data: stats
            });
        } catch (error) {
            console.error('저장소 통계 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '저장소 통계 조회에 실패했습니다.'
            });
        }
    },

    // 저장소 타입 변경
    changeStorageType: async (req, res) => {
        try {
            const userId = req.user.id;
            const { type, transferData } = req.body;

            if (!utils.validateStorageType(type)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 저장소 타입입니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const [currentSettings] = await connection.execute(
                    'SELECT * FROM storage_settings WHERE memberId = ?',
                    [userId]
                );

                if (!currentSettings) {
                    throw new Error('저장소 설정을 찾을 수 없습니다.');
                }

                await connection.execute(`
          UPDATE storage_settings 
          SET storageType = ?, lastSyncAt = NOW()
          WHERE memberId = ?
        `, [type, userId]);

                if (transferData) {
                    await connection.execute(`
            INSERT INTO storage_usage_logs (
              memberId, storageType, action, sizeChange, 
              details, createdAt
            ) VALUES (?, ?, 'modify', ?, ?, NOW())
          `, [
                        userId,
                        type,
                        transferData.size || 0,
                        JSON.stringify(transferData)
                    ]);
                }

                return { success: true, type };
            });

            res.status(200).json({
                success: true,
                message: '저장소 타입이 성공적으로 변경되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('저장소 타입 변경 오류:', error);
            res.status(500).json({
                success: false,
                message: '저장소 타입 변경에 실패했습니다.'
            });
        }
    },

    // 데이터 동기화
    syncData: async (req, res) => {
        try {
            const userId = req.user.id;
            const { type = 'manual' } = req.body;

            if (!utils.validateSyncType(type)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 동기화 타입입니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const [inProgress] = await connection.execute(`
          SELECT id FROM storage_syncs 
          WHERE memberId = ? AND status = 'in_progress'
        `, [userId]);

                if (inProgress) {
                    throw new Error('이미 진행 중인 동기화가 있습니다.');
                }

                const [sync] = await connection.execute(`
          INSERT INTO storage_syncs (
            memberId, status, startedAt, syncType
          ) VALUES (?, 'in_progress', NOW(), ?)
        `, [userId, type]);

                await connection.execute(`
          UPDATE storage_settings
          SET lastSyncAt = NOW()
          WHERE memberId = ?
        `, [userId]);

                return {
                    syncId: sync.insertId,
                    status: 'in_progress',
                    startedAt: new Date()
                };
            });

            res.status(200).json({
                success: true,
                message: '데이터 동기화가 시작되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('데이터 동기화 오류:', error);
            res.status(500).json({
                success: false,
                message: '데이터 동기화에 실패했습니다.'
            });
        }
    }
};

module.exports = storageController;
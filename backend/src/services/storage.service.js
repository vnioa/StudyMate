const { dbUtils } = require('../config/database.config');

const storageService = {
    // 현재 저장소 타입 조회
    async getCurrentStorage(userId) {
        try {
            const query = `
                SELECT storageType, cloudStorageUsed, deviceStorageUsed, 
                       lastSyncAt, autoSync, syncInterval
                FROM storage_settings
                WHERE memberId = ?
            `;

            const [storage] = await dbUtils.query(query, [userId]);
            if (!storage) {
                throw new Error('저장소 설정을 찾을 수 없습니다.');
            }
            return storage;
        } catch (error) {
            throw new Error('저장소 정보 조회 실패: ' + error.message);
        }
    },

    // 저장소 통계 조회
    async getStorageStats(userId) {
        try {
            const query = `
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
            `;

            const [stats] = await dbUtils.query(query, [userId, userId, userId]);
            return stats;
        } catch (error) {
            throw new Error('저장소 통계 조회 실패: ' + error.message);
        }
    },

    // 저장소 타입 변경
    async changeStorageType(userId, type, transferData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 현재 저장소 설정 조회
                const [currentSettings] = await connection.query(
                    'SELECT * FROM storage_settings WHERE memberId = ?',
                    [userId]
                );

                if (!currentSettings) {
                    throw new Error('저장소 설정을 찾을 수 없습니다.');
                }

                // 저장소 타입 변경
                await connection.query(`
                    UPDATE storage_settings 
                    SET storageType = ?, lastSyncAt = NOW()
                    WHERE memberId = ?
                `, [type, userId]);

                // 데이터 전송 기록
                if (transferData) {
                    await connection.query(`
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
            } catch (error) {
                throw new Error('저장소 타입 변경 실패: ' + error.message);
            }
        });
    },

    // 데이터 동기화
    async syncData(userId, type) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 진행 중인 동기화 확인
                const [inProgress] = await connection.query(`
                    SELECT id FROM storage_syncs 
                    WHERE memberId = ? AND status = 'in_progress'
                `, [userId]);

                if (inProgress) {
                    throw new Error('이미 진행 중인 동기화가 있습니다.');
                }

                // 새로운 동기화 작업 생성
                const [result] = await connection.query(`
                    INSERT INTO storage_syncs (
                        memberId, status, startedAt, syncType
                    ) VALUES (?, 'in_progress', NOW(), ?)
                `, [userId, type]);

                const syncId = result.insertId;

                // 저장소 설정 업데이트
                await connection.query(`
                    UPDATE storage_settings
                    SET lastSyncAt = NOW()
                    WHERE memberId = ?
                `, [userId]);

                return {
                    syncId,
                    status: 'in_progress',
                    startedAt: new Date()
                };
            } catch (error) {
                throw new Error('데이터 동기화 시작 실패: ' + error.message);
            }
        });
    }
};

module.exports = storageService;
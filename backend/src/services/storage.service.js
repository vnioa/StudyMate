const { StorageSettings, StorageSync, StorageUsageLog } = require('../models');
const { dbUtils } = require('../config/db');

const storageService = {
    // 현재 저장소 타입 조회
    async getCurrentStorage(userId) {
        try {
            const query = `
                SELECT storageType, cloudStorageUsed, deviceStorageUsed,
                       lastSyncAt, autoSync, syncInterval
                FROM storage_settings
                WHERE userId = ?
            `;
            const [storage] = await dbUtils.query(query, [userId]);

            if (!storage) {
                throw new Error('저장소 설정을 찾을 수 없습니다');
            }

            return { storage };
        } catch (error) {
            throw new Error('저장소 타입 조회 실패: ' + error.message);
        }
    },

    // 저장소 통계 조회
    async getStorageStats(userId) {
        try {
            // 저장소 사용량 통계
            const storageQuery = `
                SELECT 
                    storageType,
                    SUM(CASE WHEN action = 'add' THEN sizeChange
                         WHEN action = 'delete' THEN -sizeChange
                         ELSE 0 END) as totalUsage,
                    COUNT(*) as actionCount
                FROM storage_usage_logs
                WHERE userId = ?
                GROUP BY storageType
            `;
            const storageStats = await dbUtils.query(storageQuery, [userId]);

            // 최근 동기화 기록
            const syncQuery = `
                SELECT status, startedAt, completedAt, dataTransferred, error
                FROM storage_syncs
                WHERE userId = ?
                ORDER BY startedAt DESC
                LIMIT 5
            `;
            const recentSyncs = await dbUtils.query(syncQuery, [userId]);

            return {
                storageStats,
                recentSyncs
            };
        } catch (error) {
            throw new Error('저장소 통계 조회 실패: ' + error.message);
        }
    },

    // 저장소 타입 변경
    async changeStorageType(userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const { type, transferData } = data;

                // 현재 설정 조회
                const [currentSettings] = await connection.query(
                    'SELECT * FROM storage_settings WHERE userId = ?',
                    [userId]
                );

                if (!currentSettings) {
                    throw new Error('저장소 설정을 찾을 수 없습니다');
                }

                // 저장소 타입 업데이트
                await connection.query(`
                    UPDATE storage_settings
                    SET storageType = ?,
                        lastSyncAt = NOW()
                    WHERE userId = ?
                `, [type, userId]);

                // 데이터 이전이 필요한 경우
                if (transferData) {
                    await connection.query(`
                        INSERT INTO storage_syncs
                        (userId, status, startedAt)
                        VALUES (?, 'in_progress', NOW())
                    `, [userId]);
                }

                // 사용 로그 기록
                await connection.query(`
                    INSERT INTO storage_usage_logs
                    (userId, storageType, action, sizeChange, details)
                    VALUES (?, ?, 'modify', 0, ?)
                `, [
                    userId,
                    type,
                    JSON.stringify({ reason: 'storage_type_change' })
                ]);

                return { success: true };
            } catch (error) {
                throw new Error('저장소 타입 변경 실패: ' + error.message);
            }
        });
    },

    // 데이터 동기화
    async syncData(userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 진행 중인 동기화 확인
                const [activeSync] = await connection.query(`
                    SELECT id FROM storage_syncs
                    WHERE userId = ? AND status = 'in_progress'
                `, [userId]);

                if (activeSync) {
                    throw new Error('이미 동기화가 진행 중입니다');
                }

                // 새 동기화 작업 생성
                const [result] = await connection.query(`
                    INSERT INTO storage_syncs
                    (userId, status, startedAt)
                    VALUES (?, 'in_progress', NOW())
                `, [userId]);

                const syncId = result.insertId;

                // 동기화 완료 후 상태 업데이트
                await connection.query(`
                    UPDATE storage_settings
                    SET lastSyncAt = NOW()
                    WHERE userId = ?
                `, [userId]);

                await connection.query(`
                    UPDATE storage_syncs
                    SET status = 'completed',
                        completedAt = NOW()
                    WHERE id = ?
                `, [syncId]);

                return { success: true, syncId };
            } catch (error) {
                throw new Error('데이터 동기화 실패: ' + error.message);
            }
        });
    }
};

module.exports = storageService;
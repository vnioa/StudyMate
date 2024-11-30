const db = require('../config/mysql');
const createError = require('http-errors');

const StorageController = {
    // 현재 저장소 타입 조회
    getCurrentStorage: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [storage] = await connection.query(
                'SELECT storage_type as type FROM user_storage_settings WHERE user_id = ?',
                [req.user.id]
            );

            if (!storage.length) {
                // 기본값으로 device 반환
                return res.json({ type: 'device' });
            }

            res.json({ type: storage[0].type });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 저장소 통계 조회
    getStorageStats: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [[stats], [lastSync]] = await Promise.all([
                connection.query(
                    `SELECT 
            SUM(CASE WHEN storage_type = 'device' THEN size ELSE 0 END) as device_storage,
            SUM(CASE WHEN storage_type = 'cloud' THEN size ELSE 0 END) as cloud_storage
           FROM user_storage_data 
           WHERE user_id = ?`,
                    [req.user.id]
                ),
                connection.query(
                    'SELECT last_sync FROM user_storage_settings WHERE user_id = ?',
                    [req.user.id]
                )
            ]);

            res.json({
                deviceStorage: stats?.device_storage || 0,
                cloudStorage: stats?.cloud_storage || 0,
                lastSync: lastSync[0]?.last_sync || null
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 저장소 타입 변경
    changeStorageType: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { type, transferData } = req.body;

            await connection.beginTransaction();

            // 저장소 타입 업데이트
            await connection.query(
                `INSERT INTO user_storage_settings (user_id, storage_type) 
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE storage_type = ?`,
                [req.user.id, type, type]
            );

            if (transferData) {
                // 데이터 이전 처리
                await connection.query(
                    'UPDATE user_storage_data SET storage_type = ? WHERE user_id = ?',
                    [type, req.user.id]
                );
            }

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 데이터 동기화
    syncData: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 동기화 시간 업데이트
            await connection.query(
                `UPDATE user_storage_settings 
         SET last_sync = NOW()
         WHERE user_id = ?`,
                [req.user.id]
            );

            // 여기에 실제 데이터 동기화 로직 구현
            // 클라우드 저장소와 디바이스 저장소 간의 데이터 동기화

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = StorageController;
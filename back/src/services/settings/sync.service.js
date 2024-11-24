const db = require('../../config/mysql');

class SyncService {
    // 디바이스 등록/업데이트
    async registerDevice(userId, deviceInfo) {
        try {
            const { deviceId, deviceName, platform } = deviceInfo;

            await db.execute(
                'INSERT INTO devices (user_id, device_id, device_name, platform, last_sync) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE device_name = ?, last_sync = NOW()',
                [userId, deviceId, deviceName, platform, deviceName]
            );

            return true;
        } catch (error) {
            console.error('디바이스 등록 오류:', error);
            throw new Error('디바이스 등록에 실패했습니다.');
        }
    }

    // 데이터 동기화
    async syncData(userId, deviceId, data) {
        try {
            await db.beginTransaction();

            try {
                // 사용자 설정 동기화
                if (data.settings) {
                    await db.execute(
                        'UPDATE user_settings SET ? WHERE user_id = ?',
                        [data.settings, userId]
                    );
                }

                // 학습 데이터 동기화
                if (data.studyData) {
                    for (const item of data.studyData) {
                        await db.execute(
                            'INSERT INTO study_sessions (user_id, title, duration, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE duration = ?',
                            [userId, item.title, item.duration, item.created_at, item.duration]
                        );
                    }
                }

                // 동기화 시간 업데이트
                await db.execute(
                    'UPDATE devices SET last_sync = NOW() WHERE user_id = ? AND device_id = ?',
                    [userId, deviceId]
                );

                await db.commit();
                return true;
            } catch (error) {
                await db.rollback();
                throw error;
            }
        } catch (error) {
            console.error('데이터 동기화 오류:', error);
            throw new Error('데이터 동기화에 실패했습니다.');
        }
    }

    // 동기화 상태 확인
    async checkSyncStatus(userId, deviceId) {
        try {
            const [device] = await db.execute(
                'SELECT last_sync FROM devices WHERE user_id = ? AND device_id = ?',
                [userId, deviceId]
            );

            if (device.length === 0) {
                throw new Error('등록되지 않은 디바이스입니다.');
            }

            const [lastChanges] = await db.execute(
                'SELECT MAX(updated_at) as last_update FROM (SELECT updated_at FROM user_settings WHERE user_id = ? UNION ALL SELECT created_at FROM study_sessions WHERE user_id = ?) as updates',
                [userId, userId]
            );

            return {
                needsSync: new Date(lastChanges[0].last_update) > new Date(device[0].last_sync),
                lastSync: device[0].last_sync
            };
        } catch (error) {
            console.error('동기화 상태 확인 오류:', error);
            throw new Error('동기화 상태 확인에 실패했습니다.');
        }
    }

    // 디바이스 목록 조회
    async getDevices(userId) {
        try {
            const [devices] = await db.execute(
                'SELECT device_id, device_name, platform, last_sync FROM devices WHERE user_id = ?',
                [userId]
            );
            return devices;
        } catch (error) {
            console.error('디바이스 목록 조회 오류:', error);
            throw new Error('디바이스 목록 조회에 실패했습니다.');
        }
    }

    // 디바이스 삭제
    async removeDevice(userId, deviceId) {
        try {
            await db.execute(
                'DELETE FROM devices WHERE user_id = ? AND device_id = ?',
                [userId, deviceId]
            );
            return true;
        } catch (error) {
            console.error('디바이스 삭제 오류:', error);
            throw new Error('디바이스 삭제에 실패했습니다.');
        }
    }
}

module.exports = new SyncService();
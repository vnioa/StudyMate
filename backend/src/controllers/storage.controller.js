const { StorageSettings, StorageSync, StorageUsageLog, STORAGE_TYPES, SYNC_STATUS, SYNC_TYPES } = require('../models').Storage;
const { CustomError } = require('../utils/error.utils');

const storageController = {
    // 현재 저장소 타입 조회
    async getCurrentStorage(req, res, next) {
        try {
            const storageSettings = await StorageSettings.findOne({
                where: { memberId: req.user.id }
            });

            if (!storageSettings) {
                throw new CustomError('저장소 설정을 찾을 수 없습니다.', 404);
            }

            res.status(200).json({
                success: true,
                data: {
                    storageType: storageSettings.storageType,
                    cloudStorageUsed: storageSettings.cloudStorageUsed,
                    deviceStorageUsed: storageSettings.deviceStorageUsed,
                    lastSyncAt: storageSettings.lastSyncAt
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 저장소 통계 조회
    async getStorageStats(req, res, next) {
        try {
            const storageSettings = await StorageSettings.findOne({
                where: { memberId: req.user.id }
            });

            if (!storageSettings) {
                throw new CustomError('저장소 설정을 찾을 수 없습니다.', 404);
            }

            const usageLogs = await StorageUsageLog.findAll({
                where: { memberId: req.user.id },
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            res.status(200).json({
                success: true,
                data: {
                    storage: {
                        cloud: {
                            used: storageSettings.cloudStorageUsed,
                            max: storageSettings.maxCloudStorage
                        },
                        device: {
                            used: storageSettings.deviceStorageUsed,
                            max: storageSettings.maxDeviceStorage
                        }
                    },
                    recentActivity: usageLogs
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 저장소 타입 변경
    async changeStorageType(req, res, next) {
        try {
            const { type, transferData } = req.body;
            const memberId = req.user.id;

            if (!Object.values(STORAGE_TYPES).includes(type)) {
                throw new CustomError('유효하지 않은 저장소 타입입니다.', 400);
            }

            const [updated] = await StorageSettings.update({
                storageType: type
            }, {
                where: { memberId }
            });

            if (!updated) {
                throw new CustomError('저장소 타입 변경에 실패했습니다.', 404);
            }

            if (transferData) {
                await StorageSync.create({
                    memberId,
                    status: SYNC_STATUS.PENDING,
                    startedAt: new Date(),
                    syncType: SYNC_TYPES.MANUAL
                });
            }

            res.status(200).json({
                success: true,
                message: '저장소 타입이 변경되었습니다.',
                data: { type, transferInitiated: transferData }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 데이터 동기화
    async syncData(req, res, next) {
        try {
            const memberId = req.user.id;

            const storageSync = await StorageSync.create({
                memberId,
                status: SYNC_STATUS.PENDING,
                startedAt: new Date(),
                syncType: SYNC_TYPES.MANUAL
            });

            const settings = await StorageSettings.findOne({
                where: { memberId }
            });

            if (!settings) {
                throw new CustomError('저장소 설정을 찾을 수 없습니다.', 404);
            }

            await StorageSettings.update({
                lastSyncAt: new Date()
            }, {
                where: { memberId }
            });

            res.status(200).json({
                success: true,
                message: '데이터 동기화가 시작되었습니다.',
                data: {
                    syncId: storageSync.id,
                    status: storageSync.status,
                    startedAt: storageSync.startedAt
                }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = storageController;
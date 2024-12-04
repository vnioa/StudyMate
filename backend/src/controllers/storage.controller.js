const storageService = require('../services/storage.service');
const { CustomError } = require('../utils/error.utils');
const { STORAGE_TYPES, SYNC_TYPES } = require('../models/storage.model');

const storageController = {
    // 현재 저장소 타입 조회
    getCurrentStorage: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const currentStorage = await storageService.getCurrentStorage(userId);

            return res.status(200).json({
                success: true,
                message: '현재 저장소 정보를 성공적으로 조회했습니다.',
                data: currentStorage
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 저장소 통계 조회
    getStorageStats: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const stats = await storageService.getStorageStats(userId);

            return res.status(200).json({
                success: true,
                message: '저장소 통계를 성공적으로 조회했습니다.',
                data: stats
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 저장소 타입 변경
    changeStorageType: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { type, transferData } = req.body;

            if (!Object.values(STORAGE_TYPES).includes(type)) {
                throw new CustomError('유효하지 않은 저장소 타입입니다.', 400);
            }

            const result = await storageService.changeStorageType(userId, type, transferData);

            return res.status(200).json({
                success: true,
                message: '저장소 타입이 성공적으로 변경되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 데이터 동기화
    syncData: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { type = SYNC_TYPES.MANUAL } = req.body;

            if (!Object.values(SYNC_TYPES).includes(type)) {
                throw new CustomError('유효하지 않은 동기화 타입입니다.', 400);
            }

            const syncResult = await storageService.syncData(userId, type);

            return res.status(200).json({
                success: true,
                message: '데이터 동기화가 시작되었습니다.',
                data: syncResult
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = storageController;
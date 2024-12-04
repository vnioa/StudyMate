const backupService = require('../services/backup.service');
const { CustomError } = require('../utils/error.utils');

const backupController = {
    // 마지막 백업 정보 조회
    getLastBackup: async (req, res, next) => {
        try {
            const lastBackup = await backupService.getLastBackup();

            if (!lastBackup) {
                return res.status(404).json({
                    success: false,
                    message: '백업 정보가 존재하지 않습니다.'
                });
            }

            return res.status(200).json({
                success: true,
                message: '마지막 백업 정보를 성공적으로 조회했습니다.',
                data: lastBackup
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 백업 상태 조회
    getBackupStatus: async (req, res, next) => {
        try {
            const status = await backupService.getBackupStatus();

            return res.status(200).json({
                success: true,
                message: '백업 상태를 성공적으로 조회했습니다.',
                data: status
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 새로운 백업 생성
    createBackup: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { type, compressionType, description } = req.body;

            const backup = await backupService.createBackup({
                type,
                compressionType,
                description,
                performedBy: userId
            });

            return res.status(201).json({
                success: true,
                message: '백업이 성공적으로 생성되었습니다.',
                data: backup
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 백업 복원
    restoreFromBackup: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { backupId } = req.body;

            if (!backupId) {
                throw new CustomError('백업 ID가 필요합니다.', 400);
            }

            const result = await backupService.restoreFromBackup(backupId, userId);

            return res.status(200).json({
                success: true,
                message: '백업 복원이 시작되었습니다.',
                data: result
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 백업 설정 조회
    getSettings: async (req, res, next) => {
        try {
            const settings = await backupService.getBackupSettings();

            return res.status(200).json({
                success: true,
                message: '백업 설정을 성공적으로 조회했습니다.',
                data: settings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 백업 설정 업데이트
    updateSettings: async (req, res, next) => {
        try {
            const { isAutoBackup, backupInterval } = req.body;
            const userId = req.user.id;

            if (backupInterval && (backupInterval < 1 || backupInterval > 168)) {
                throw new CustomError('백업 주기는 1시간에서 168시간(7일) 사이여야 합니다.', 400);
            }

            const updatedSettings = await backupService.updateBackupSettings({
                isAutoBackup,
                backupInterval,
                updatedBy: userId
            });

            return res.status(200).json({
                success: true,
                message: '백업 설정이 성공적으로 업데이트되었습니다.',
                data: updatedSettings
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = backupController;
const backupService = require('../services/backup.service');
const { CustomError } = require('../utils/error.utils');

const backupController = {
    // 마지막 백업 정보 조회
    async getLastBackup(req, res, next) {
        try {
            const lastBackup = await backupService.getLastBackup();

            res.json({
                success: true,
                data: lastBackup
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 백업 상태 조회
    async getBackupStatus(req, res, next) {
        try {
            const status = await backupService.getBackupStatus();

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 새로운 백업 생성
    async createBackup(req, res, next) {
        try {
            const { type, compressionType, description } = req.body;
            const userId = req.user.id;

            const backup = await backupService.createBackup({
                type,
                compressionType,
                description,
                performedBy: userId
            });

            res.status(201).json({
                success: true,
                data: backup
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 백업 복원
    async restoreFromBackup(req, res, next) {
        try {
            const { backupId } = req.body;
            const userId = req.user.id;

            if (!backupId) {
                throw new CustomError('백업 ID가 필요합니다.', 400);
            }

            const result = await backupService.restoreFromBackup(backupId, userId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 백업 설정 조회
    async getSettings(req, res, next) {
        try {
            const settings = await backupService.getSettings();

            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 백업 설정 업데이트
    async updateSettings(req, res, next) {
        try {
            const { isAutoBackup, backupInterval } = req.body;
            const userId = req.user.id;

            // 백업 간격 유효성 검사
            if (backupInterval && (backupInterval < 1 || backupInterval > 168)) {
                throw new CustomError('백업 간격은 1시간에서 168시간(7일) 사이여야 합니다.', 400);
            }

            const updatedSettings = await backupService.updateSettings({
                isAutoBackup,
                backupInterval,
                updatedBy: userId
            });

            res.json({
                success: true,
                data: updatedSettings
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = backupController;
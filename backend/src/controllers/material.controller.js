const materialService = require('../services/material.service');
const { CustomError } = require('../utils/error.utils');
const { SHARE_TYPES, FILE_TYPES } = require('../models/material.model');

const materialController = {
    // 학습 자료 상세 조회
    async getMaterialDetail(req, res, next) {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;

            const material = await materialService.getMaterialDetail(materialId, userId);

            res.status(200).json({
                success: true,
                message: '학습 자료를 성공적으로 조회했습니다.',
                data: material
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 학습 자료 수정
    async updateMaterial(req, res, next) {
        try {
            const { materialId } = req.params;
            const { title, description, content, references } = req.body;
            const userId = req.user.id;

            const updatedMaterial = await materialService.updateMaterial(materialId, {
                title,
                description,
                content,
                references,
                updatedBy: userId
            });

            res.status(200).json({
                success: true,
                message: '학습 자료가 성공적으로 수정되었습니다.',
                data: updatedMaterial
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 학습 자료 공유
    async shareMaterial(req, res, next) {
        try {
            const { materialId } = req.params;
            const { shareType, recipients } = req.body;
            const userId = req.user.id;

            if (!Object.values(SHARE_TYPES).includes(shareType)) {
                throw new CustomError('유효하지 않은 공유 유형입니다.', 400);
            }

            if (!Array.isArray(recipients) || recipients.length === 0) {
                throw new CustomError('수신자 목록이 필요합니다.', 400);
            }

            const result = await materialService.shareMaterial(materialId, {
                shareType,
                recipients,
                sharedBy: userId
            });

            res.status(201).json({
                success: true,
                message: '학습 자료가 성공적으로 공유되었습니다.',
                data: result
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 학습 자료 다운로드 URL 조회
    async getMaterialDownloadUrl(req, res, next) {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;

            const downloadUrl = await materialService.getMaterialDownloadUrl(materialId, userId);

            res.status(200).json({
                success: true,
                message: '다운로드 URL이 성공적으로 생성되었습니다.',
                data: { downloadUrl }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = materialController;
const materialService = require('../services/material.service');
const { CustomError } = require('../utils/error.utils');
const { SHARE_TYPES } = require('../models/material.model');

const materialController = {
    // 학습 자료 상세 조회
    getMaterialDetail: async (req, res, next) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;

            const material = await materialService.getMaterialDetail(materialId, userId);

            return res.status(200).json({
                success: true,
                message: '학습 자료를 성공적으로 조회했습니다.',
                data: material
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 수정
    updateMaterial: async (req, res, next) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;
            const { title, description, content, references } = req.body;

            const updatedMaterial = await materialService.updateMaterial(materialId, userId, {
                title,
                description,
                content,
                references
            });

            return res.status(200).json({
                success: true,
                message: '학습 자료가 성공적으로 수정되었습니다.',
                data: updatedMaterial
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 공유
    shareMaterial: async (req, res, next) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;
            const { shareType, recipients } = req.body;

            if (!Object.values(SHARE_TYPES).includes(shareType)) {
                throw new CustomError('유효하지 않은 공유 유형입니다.', 400);
            }

            if (!Array.isArray(recipients) || recipients.length === 0) {
                throw new CustomError('수신자 목록이 필요합니다.', 400);
            }

            const shareResults = await materialService.shareMaterial(materialId, userId, {
                shareType,
                recipients
            });

            return res.status(200).json({
                success: true,
                message: '학습 자료가 성공적으로 공유되었습니다.',
                data: shareResults
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 자료 다운로드
    getMaterialDownloadUrl: async (req, res, next) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;

            const downloadUrl = await materialService.getMaterialDownloadUrl(materialId, userId);

            return res.status(200).json({
                success: true,
                message: '다운로드 URL이 생성되었습니다.',
                data: { downloadUrl }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = materialController;
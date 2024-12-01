const materialService = require('../services/material.service');

const materialController = {
    // 학습 자료 상세 조회
    getMaterialDetail: async (req, res) => {
        try {
            const result = await materialService.getMaterialDetail(req.params.materialId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 자료 수정
    updateMaterial: async (req, res) => {
        try {
            const result = await materialService.updateMaterial(req.params.materialId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 자료 공유
    shareMaterial: async (req, res) => {
        try {
            const result = await materialService.shareMaterial(req.params.materialId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 자료 다운로드
    getMaterialDownloadUrl: async (req, res) => {
        try {
            const result = await materialService.getMaterialDownloadUrl(req.params.materialId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = materialController;
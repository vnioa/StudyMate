const fileService = require('../services/file.service');

const fileController = {
    // 파일 목록 조회
    getFiles: async (req, res) => {
        try {
            const result = await fileService.getFiles();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 파일 타입별 필터링
    filterFilesByType: async (req, res) => {
        try {
            const result = await fileService.filterFilesByType(req.params.type);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 파일 검색
    searchFiles: async (req, res) => {
        try {
            const result = await fileService.searchFiles(req.query.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 파일 공유 설정 업데이트
    updateFileSharing: async (req, res) => {
        try {
            const result = await fileService.updateFileSharing(req.params.fileId, req.body.isShared);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 파일 만료일 설정
    setFileExpiry: async (req, res) => {
        try {
            const result = await fileService.setFileExpiry(req.params.fileId, req.body.expiryDate);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 파일 미리보기
    getFilePreview: async (req, res) => {
        try {
            const result = await fileService.getFilePreview(req.params.fileId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 파일 삭제
    deleteFile: async (req, res) => {
        try {
            const result = await fileService.deleteFile(req.params.fileId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = fileController;
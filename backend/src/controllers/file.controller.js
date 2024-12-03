const fileService = require('../services/file.service');
const { CustomError } = require('../utils/error.utils');
const { FILE_TYPES } = require('../models/file.model');

const fileController = {
    // 파일 목록 조회
    async getFiles(req, res, next) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;

            const files = await fileService.getFiles(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                order
            });

            res.json({
                success: true,
                data: files
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 파일 타입별 필터링
    async filterFilesByType(req, res, next) {
        try {
            const userId = req.user.id;
            const { type } = req.params;
            const { page = 1, limit = 10 } = req.query;

            if (!Object.values(FILE_TYPES).includes(type)) {
                throw new CustomError('유효하지 않은 파일 타입입니다.', 400);
            }

            const files = await fileService.filterFilesByType(userId, type, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: files
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 파일 검색
    async searchFiles(req, res, next) {
        try {
            const userId = req.user.id;
            const { query, page = 1, limit = 10 } = req.query;

            if (!query) {
                throw new CustomError('검색어를 입력해주세요.', 400);
            }

            const files = await fileService.searchFiles(userId, query, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: files
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 파일 공유 설정 업데이트
    async updateFileSharing(req, res, next) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;
            const { sharedWith, permission } = req.body;

            const updatedFile = await fileService.updateFileSharing(fileId, userId, {
                sharedWith,
                permission
            });

            res.json({
                success: true,
                data: updatedFile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 파일 만료일 설정
    async setFileExpiry(req, res, next) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;
            const { expiryDate } = req.body;

            if (!expiryDate) {
                throw new CustomError('만료일을 입력해주세요.', 400);
            }

            const updatedFile = await fileService.setFileExpiry(fileId, userId, new Date(expiryDate));

            res.json({
                success: true,
                data: updatedFile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 파일 미리보기
    async getFilePreview(req, res, next) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;

            const preview = await fileService.getFilePreview(fileId, userId);

            res.json({
                success: true,
                data: preview
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 파일 삭제
    async deleteFile(req, res, next) {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;

            await fileService.deleteFile(fileId, userId);

            res.json({
                success: true,
                message: '파일이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = fileController;
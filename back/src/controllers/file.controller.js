const fileService = require('../services/file.service');
const { CustomError } = require('../utils/error.utils');
const { FILE_TYPES } = require('../models/file.model');

const fileController = {
    // 파일 목록 조회
    getFiles: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { page, limit, sort } = req.query;

            const files = await fileService.getFiles(userId, {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                sort: sort || 'createdAt'
            });

            return res.status(200).json({
                success: true,
                message: '파일 목록을 성공적으로 조회했습니다.',
                data: files
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 파일 타입별 필터링
    filterFilesByType: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { type } = req.params;

            if (!Object.values(FILE_TYPES).includes(type)) {
                throw new CustomError('유효하지 않은 파일 타입입니다.', 400);
            }

            const files = await fileService.getFilesByType(userId, type);

            return res.status(200).json({
                success: true,
                message: '파일이 성공적으로 필터링되었습니다.',
                data: files
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 파일 검색
    searchFiles: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { query, type } = req.query;

            const files = await fileService.searchFiles(userId, query, type);

            return res.status(200).json({
                success: true,
                message: '파일 검색이 완료되었습니다.',
                data: files
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 파일 공유 설정 업데이트
    updateFileSharing: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            const { sharedWith, permissions } = req.body;
            const userId = req.user.id;

            const updatedFile = await fileService.updateFileSharing(fileId, userId, {
                sharedWith,
                permissions
            });

            return res.status(200).json({
                success: true,
                message: '파일 공유 설정이 업데이트되었습니다.',
                data: updatedFile
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 파일 만료일 설정
    setFileExpiry: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            const { expiryDate } = req.body;
            const userId = req.user.id;

            if (new Date(expiryDate) <= new Date()) {
                throw new CustomError('만료일은 현재 날짜보다 이후여야 합니다.', 400);
            }

            const updatedFile = await fileService.setFileExpiry(fileId, userId, expiryDate);

            return res.status(200).json({
                success: true,
                message: '파일 만료일이 설정되었습니다.',
                data: updatedFile
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 파일 미리보기
    getFilePreview: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;

            const preview = await fileService.getFilePreview(fileId, userId);

            return res.status(200).json({
                success: true,
                message: '파일 미리보기를 성공적으로 조회했습니다.',
                data: preview
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 파일 삭제
    deleteFile: async (req, res, next) => {
        try {
            const { fileId } = req.params;
            const userId = req.user.id;

            await fileService.deleteFile(fileId, userId);

            return res.status(200).json({
                success: true,
                message: '파일이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = fileController;
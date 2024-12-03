const profileService = require('../services/profile.service');
const { CustomError } = require('../utils/error.utils');
const { VISIBILITY_TYPES, ACTIVITY_STATUS } = require('../models/profile.model');

const profileController = {
    // 내 프로필 조회
    async getMyProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await profileService.getProfile(userId);

            res.status(200).json({
                success: true,
                message: '프로필을 성공적으로 조회했습니다.',
                data: profile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 프로필 수정
    async updateProfile(req, res, next) {
        try {
            const { nickname, bio } = req.body;
            const userId = req.user.id;

            if (bio && bio.length > 1000) {
                throw new CustomError('자기소개는 1000자를 초과할 수 없습니다.', 400);
            }

            const updatedProfile = await profileService.updateProfile(userId, {
                nickname,
                bio
            });

            res.status(200).json({
                success: true,
                message: '프로필이 성공적으로 수정되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 상태 메시지 업데이트
    async updateStatus(req, res, next) {
        try {
            const { message } = req.body;
            const userId = req.user.id;

            if (message.length > 200) {
                throw new CustomError('상태 메시지는 200자를 초과할 수 없습니다.', 400);
            }

            const updatedProfile = await profileService.updateStatus(userId, message);

            res.status(200).json({
                success: true,
                message: '상태 메시지가 성공적으로 업데이트되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 프로필 이미지 업로드
    async uploadProfileImage(req, res, next) {
        try {
            const image = req.file;
            const userId = req.user.id;

            if (!image) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const updatedProfile = await profileService.uploadProfileImage(userId, image);

            res.status(200).json({
                success: true,
                message: '프로필 이미지가 성공적으로 업로드되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 배경 이미지 업로드
    async uploadBackgroundImage(req, res, next) {
        try {
            const image = req.file;
            const userId = req.user.id;

            if (!image) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const updatedProfile = await profileService.uploadBackgroundImage(userId, image);

            res.status(200).json({
                success: true,
                message: '배경 이미지가 성공적으로 업로드되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 활동 상태 업데이트
    async updateActivityStatus(req, res, next) {
        try {
            const { status } = req.body;
            const userId = req.user.id;

            if (!Object.values(ACTIVITY_STATUS).includes(status)) {
                throw new CustomError('유효하지 않은 활동 상태입니다.', 400);
            }

            const updatedProfile = await profileService.updateActivityStatus(userId, status);

            res.status(200).json({
                success: true,
                message: '활동 상태가 성공적으로 업데이트되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 프로필 공개 범위 설정
    async updateVisibility(req, res, next) {
        try {
            const { visibility } = req.body;
            const userId = req.user.id;

            if (!Object.values(VISIBILITY_TYPES).includes(visibility)) {
                throw new CustomError('유효하지 않은 공개 범위입니다.', 400);
            }

            const updatedProfile = await profileService.updateVisibility(userId, visibility);

            res.status(200).json({
                success: true,
                message: '프로필 공개 범위가 성공적으로 업데이트되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = profileController;
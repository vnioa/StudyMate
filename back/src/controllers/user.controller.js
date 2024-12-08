const userService = require('../services/user.service');
const { CustomError } = require('../utils/error.utils');
const { USER_STATUS } = require('../models/user.model');

const userController = {
    // 이름 유효성 검사
    validateName: async (req, res, next) => {
        try {
            const { name } = req.body;
            await userService.validateName(name);

            return res.status(200).json({
                success: true,
                message: '유효한 이름입니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 이름 업데이트
    updateName: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { name } = req.body;

            const updatedUser = await userService.updateName(userId, name);

            return res.status(200).json({
                success: true,
                message: '이름이 성공적으로 업데이트되었습니다.',
                data: updatedUser
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 프로필 조회
    getProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const profile = await userService.getProfile(userId);

            return res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 프로필 업데이트
    updateProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const profileData = req.body;

            const updatedProfile = await userService.updateProfile(userId, profileData);

            return res.status(200).json({
                success: true,
                message: '프로필이 성공적으로 업데이트되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 프로필 공개 설정 업데이트
    updatePrivacy: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { isPublic } = req.body;

            const updated = await userService.updatePrivacy(userId, isPublic);

            return res.status(200).json({
                success: true,
                message: '프로필 공개 설정이 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 이미지 업로드
    uploadImage: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { type } = req.params;
            const file = req.file;

            if (!file) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const updatedUser = await userService.uploadImage(userId, type, file);

            return res.status(200).json({
                success: true,
                message: '이미지가 성공적으로 업로드되었습니다.',
                data: updatedUser
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 사용자 정보 조회
    getUserInfo: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const userInfo = await userService.getUserInfo(userId);

            return res.status(200).json({
                success: true,
                data: userInfo
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 사용자 정보 업데이트
    updateUserInfo: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const userInfo = req.body;

            const updated = await userService.updateUserInfo(userId, userInfo);

            return res.status(200).json({
                success: true,
                message: '사용자 정보가 업데이트되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 전화번호 유효성 검사
    validatePhone: async (req, res, next) => {
        try {
            const { phone } = req.body;
            await userService.validatePhone(phone);

            return res.status(200).json({
                success: true,
                message: '유효한 전화번호입니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 비밀번호 유효성 검사
    validatePassword: async (req, res, next) => {
        try {
            const { password } = req.body;
            await userService.validatePassword(password);

            return res.status(200).json({
                success: true,
                message: '유효한 비밀번호입니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 계정 연결 해제
    disconnectAccount: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { accountId } = req.params;

            await userService.disconnectAccount(userId, accountId);

            return res.status(200).json({
                success: true,
                message: '계정이 연결 해제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 비밀번호 변경
    changePassword: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            await userService.changePassword(userId, currentPassword, newPassword);

            return res.status(200).json({
                success: true,
                message: '비밀번호가 성공적으로 변경되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 소셜 계정 목록 조회
    getSocialAccounts: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const accounts = await userService.getSocialAccounts(userId);

            return res.status(200).json({
                success: true,
                data: accounts
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 주 계정 조회
    getPrimaryAccount: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const primaryAccount = await userService.getPrimaryAccount(userId);

            return res.status(200).json({
                success: true,
                data: primaryAccount
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 주 계정 설정
    setPrimaryAccount: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { accountId } = req.params;

            const updated = await userService.setPrimaryAccount(userId, accountId);

            return res.status(200).json({
                success: true,
                message: '주 계정이 설정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 소셜 계정 연결 해제
    disconnectSocialAccount: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { accountId } = req.params;

            await userService.disconnectSocialAccount(userId, accountId);

            return res.status(200).json({
                success: true,
                message: '소셜 계정이 연결 해제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = userController;
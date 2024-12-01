const userService = require('../services/user.service');

const userController = {
    // 이름 유효성 검사
    validateName: async (req, res) => {
        try {
            const result = await userService.validateName(req.body.name);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 이름 변경
    updateName: async (req, res) => {
        try {
            const result = await userService.updateName(req.body.name);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 사용자 프로필 조회
    getProfile: async (req, res) => {
        try {
            const result = await userService.getProfile();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 프로필 이미지 업로드
    uploadImage: async (req, res) => {
        try {
            const result = await userService.uploadImage(req.params.type, req.file);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 사용자 정보 조회
    getUserInfo: async (req, res) => {
        try {
            const result = await userService.getUserInfo();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 사용자 정보 수정
    updateUserInfo: async (req, res) => {
        try {
            const result = await userService.updateUserInfo(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 전화번호 유효성 검사
    validatePhone: async (req, res) => {
        try {
            const result = await userService.validatePhone(req.body.phone);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 비밀번호 유효성 검사
    validatePassword: async (req, res) => {
        try {
            const result = await userService.validatePassword(req.body.password);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 프로필 정보 업데이트
    updateProfile: async (req, res) => {
        try {
            const result = await userService.updateProfile(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 프로필 공개 설정 변경
    updatePrivacy: async (req, res) => {
        try {
            const result = await userService.updatePrivacy(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 연동 계정 해제
    disconnectAccount: async (req, res) => {
        try {
            const result = await userService.disconnectAccount(req.params.accountId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 비밀번호 변경
    changePassword: async (req, res) => {
        try {
            const result = await userService.changePassword(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 소셜 계정 목록 조회
    getSocialAccounts: async (req, res) => {
        try {
            const result = await userService.getSocialAccounts();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 주 계정 조회
    getPrimaryAccount: async (req, res) => {
        try {
            const result = await userService.getPrimaryAccount();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 주 계정 설정
    setPrimaryAccount: async (req, res) => {
        try {
            const result = await userService.setPrimaryAccount(req.params.accountId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 소셜 계정 연동 해제
    disconnectSocialAccount: async (req, res) => {
        try {
            const result = await userService.disconnectSocialAccount(req.params.accountId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = userController;
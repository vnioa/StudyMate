const userService = require('../../services/user/user.service');
const emailService = require('../../services/notification/email.service');

class UserController {
    // 회원가입
    async registerUser(req, res) {
        try {
            const result = await userService.register(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // 로그인
    async loginUser(req, res) {
        try {
            const result = await userService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // 로그아웃
    async logoutUser(req, res) {
        try {
            await userService.logout(req.user.id, req.token);
            res.status(200).json({
                success: true,
                message: '로그아웃되었습니다.'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // 회원탈퇴
    async deleteUser(req, res) {
        try {
            await userService.deleteAccount(req.user.id);
            res.status(200).json({
                success: true,
                message: '회원탈퇴가 완료되었습니다.'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // 아이디 찾기
    async findUserId(req, res) {
        try {
            const result = await userService.findId(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // 비밀번호 재설정
    async resetPassword(req, res) {
        try {
            await userService.resetPassword(req.body);
            res.status(200).json({
                success: true,
                message: '비밀번호가 재설정되었습니다.'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
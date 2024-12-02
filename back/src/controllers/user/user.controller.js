const userService = require('../../services/user/user.service');
const emailService = require('../../services/notification/email.service');

class UserController {
    // 회원가입
    async registerUser(req, res) {
        try {
            console.log('Request Body:', req.body); // 요청 확인
            const result = await userService.register(req.body);
            console.log('Register Result:', result);  // 결과 확인
            res.status(201).json(result);  // 결과를 클라이언트에 반환
        } catch (error) {
            console.error('Error during registration:', error); // 에러 확인
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

    async checkUsername(req, res) {
        try {
            const { username } = req.body;
            const result = await userService.checkUsername(username);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    async sendVerificationCode(req, res) {
        try {
            const { email } = req.body;
            const result = await emailService.sendVerificationCode(email);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async validateToken(req, res) {
        try {
            const token = req.body.token;
            const isValid = await userService.validateToken(token);
            res.status(200).json({
                success: true,
                isValid
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
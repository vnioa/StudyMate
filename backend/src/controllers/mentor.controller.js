const mentorService = require('../services/mentor.service');

const mentorController = {
    // 멘토 정보 유효성 검사
    validateMentorInfo: async (req, res) => {
        try {
            const result = await mentorService.validateMentorInfo(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토 프로필 이미지 업로드
    uploadMentorImage: async (req, res) => {
        try {
            const result = await mentorService.uploadMentorImage(req.file);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토 등록
    registerMentor: async (req, res) => {
        try {
            const result = await mentorService.registerMentor(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토 정보 조회
    getMentorInfo: async (req, res) => {
        try {
            const result = await mentorService.getMentorInfo(req.params.mentorId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토 정보 수정
    updateMentorInfo: async (req, res) => {
        try {
            const result = await mentorService.updateMentorInfo(req.params.mentorId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = mentorController;
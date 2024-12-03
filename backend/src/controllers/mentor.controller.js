const mentorService = require('../services/mentor.service');
const { CustomError } = require('../utils/error.utils');
const { MENTOR_STATUS, VERIFICATION_STATUS } = require('../models/mentor.model');

const mentorController = {
    // 멘토 정보 유효성 검사
    async validateMentorInfo(req, res, next) {
        try {
            const { name, field, career, introduction } = req.body;

            if (introduction.length < 10 || introduction.length > 2000) {
                throw new CustomError('자기소개는 10자 이상 2000자 이하여야 합니다.', 400);
            }

            res.status(200).json({
                success: true,
                message: '유효한 멘토 정보입니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    // 멘토 프로필 이미지 업로드
    async uploadMentorImage(req, res, next) {
        try {
            const image = req.file;
            const userId = req.user.id;

            if (!image) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const imageUrl = await mentorService.uploadMentorImage(image, userId);

            res.status(200).json({
                success: true,
                message: '프로필 이미지가 성공적으로 업로드되었습니다.',
                data: { imageUrl }
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멘토 등록
    async registerMentor(req, res, next) {
        try {
            const mentorData = req.body;
            const userId = req.user.id;

            const mentor = await mentorService.registerMentor({
                ...mentorData,
                memberId: userId,
                status: MENTOR_STATUS.ACTIVE,
                verificationStatus: VERIFICATION_STATUS.PENDING
            });

            res.status(201).json({
                success: true,
                message: '멘토 등록이 성공적으로 완료되었습니다.',
                data: mentor
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멘토 정보 조회
    async getMentorInfo(req, res, next) {
        try {
            const { mentorId } = req.params;
            const userId = req.user.id;

            const mentorInfo = await mentorService.getMentorInfo(mentorId, userId);

            res.status(200).json({
                success: true,
                message: '멘토 정보를 성공적으로 조회했습니다.',
                data: mentorInfo
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멘토 정보 수정
    async updateMentorInfo(req, res, next) {
        try {
            const { mentorId } = req.params;
            const updateData = req.body;
            const userId = req.user.id;

            const updatedMentor = await mentorService.updateMentorInfo(mentorId, updateData, userId);

            res.status(200).json({
                success: true,
                message: '멘토 정보가 성공적으로 수정되었습니다.',
                data: updatedMentor
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = mentorController;
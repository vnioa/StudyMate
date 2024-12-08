const mentorService = require('../services/mentor.service');
const { CustomError } = require('../utils/error.utils');
const { MENTOR_STATUS, VERIFICATION_STATUS } = require('../models/mentor.model');

const mentorController = {
    // 멘토 정보 유효성 검사
    validateMentorInfo: async (req, res, next) => {
        try {
            const { name, field, career, introduction } = req.body;

            await mentorService.validateMentorInfo({
                name,
                field,
                career,
                introduction
            });

            return res.status(200).json({
                success: true,
                message: '유효한 멘토 정보입니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토 프로필 이미지 업로드
    uploadMentorImage: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const image = req.file;

            if (!image) {
                throw new CustomError('이미지 파일이 필요합니다.', 400);
            }

            const imageUrl = await mentorService.uploadMentorImage(userId, image);

            return res.status(200).json({
                success: true,
                message: '프로필 이미지가 업로드되었습니다.',
                data: { imageUrl }
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토 등록
    registerMentor: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const mentorData = {
                ...req.body,
                memberId: userId,
                status: MENTOR_STATUS.ACTIVE,
                verificationStatus: VERIFICATION_STATUS.PENDING
            };

            const mentor = await mentorService.registerMentor(mentorData);

            return res.status(201).json({
                success: true,
                message: '멘토 등록이 완료되었습니다.',
                data: mentor
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토 정보 조회
    getMentorInfo: async (req, res, next) => {
        try {
            const { mentorId } = req.params;
            const mentor = await mentorService.getMentorInfo(mentorId);

            if (!mentor) {
                throw new CustomError('멘토 정보를 찾을 수 없습니다.', 404);
            }

            return res.status(200).json({
                success: true,
                data: mentor
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토 정보 수정
    updateMentorInfo: async (req, res, next) => {
        try {
            const { mentorId } = req.params;
            const userId = req.user.id;
            const updateData = req.body;

            const updated = await mentorService.updateMentorInfo(mentorId, userId, updateData);

            return res.status(200).json({
                success: true,
                message: '멘토 정보가 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = mentorController;
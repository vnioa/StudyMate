const communityService = require('../services/community.service');
const { CustomError } = require('../utils/error.utils');

const communityController = {
    // 질문 유효성 검사
    validateQuestion: async (req, res, next) => {
        try {
            const { title, content } = req.body;
            await communityService.validateQuestion(title, content);

            return res.status(200).json({
                success: true,
                message: '유효한 질문입니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 질문 생성
    createQuestion: async (req, res, next) => {
        try {
            const { title, content } = req.body;
            const userId = req.user.id;

            const question = await communityService.createQuestion({
                title,
                content,
                memberId: userId
            });

            return res.status(201).json({
                success: true,
                message: '질문이 성공적으로 등록되었습니다.',
                data: question
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 질문 목록 조회
    getQuestions: async (req, res, next) => {
        try {
            const { page, limit, category, sort } = req.query;
            const questions = await communityService.getQuestions({
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                category,
                sort
            });

            return res.status(200).json({
                success: true,
                data: questions
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 질문 상세 조회
    getQuestion: async (req, res, next) => {
        try {
            const { questionId } = req.params;
            const userId = req.user.id;

            const question = await communityService.getQuestionDetail(questionId, userId);

            return res.status(200).json({
                success: true,
                data: question
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 질문 수정
    updateQuestion: async (req, res, next) => {
        try {
            const { questionId } = req.params;
            const { title, content } = req.body;
            const userId = req.user.id;

            const updated = await communityService.updateQuestion(questionId, userId, {
                title,
                content
            });

            return res.status(200).json({
                success: true,
                message: '질문이 성공적으로 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 질문 삭제
    deleteQuestion: async (req, res, next) => {
        try {
            const { questionId } = req.params;
            const userId = req.user.id;

            await communityService.deleteQuestion(questionId, userId);

            return res.status(200).json({
                success: true,
                message: '질문이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 답변 생성
    createAnswer: async (req, res, next) => {
        try {
            const { questionId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const answer = await communityService.createAnswer({
                questionId,
                content,
                memberId: userId
            });

            return res.status(201).json({
                success: true,
                message: '답변이 성공적으로 등록되었습니다.',
                data: answer
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 답변 삭제
    deleteAnswer: async (req, res, next) => {
        try {
            const { answerId } = req.params;
            const userId = req.user.id;

            await communityService.deleteAnswer(answerId, userId);

            return res.status(200).json({
                success: true,
                message: '답변이 성공적으로 삭제되었습니다.'
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 답변 수정
    updateAnswer: async (req, res, next) => {
        try {
            const { answerId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const updated = await communityService.updateAnswer(answerId, userId, content);

            return res.status(200).json({
                success: true,
                message: '답변이 성공적으로 수정되었습니다.',
                data: updated
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 커뮤니티 탭별 데이터 조회
    getData: async (req, res, next) => {
        try {
            const { tab } = req.params;
            const data = await communityService.getCommunityData(tab);

            return res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 스터디 그룹 생성
    createStudyGroup: async (req, res, next) => {
        try {
            const { name, category, description } = req.body;
            const userId = req.user.id;

            const group = await communityService.createStudyGroup({
                name,
                category,
                description,
                createdBy: userId
            });

            return res.status(201).json({
                success: true,
                message: '스터디 그룹이 생성되었습니다.',
                data: group
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 스터디 그룹 상세 조회
    getStudyGroup: async (req, res, next) => {
        try {
            const { groupId } = req.params;
            const group = await communityService.getStudyGroupDetail(groupId);

            return res.status(200).json({
                success: true,
                data: group
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토 등록
    registerMentor: async (req, res, next) => {
        try {
            const { field, experience, introduction } = req.body;
            const userId = req.user.id;

            const mentor = await communityService.registerMentor({
                memberId: userId,
                field,
                experience,
                introduction
            });

            return res.status(201).json({
                success: true,
                message: '멘토로 등록되었습니다.',
                data: mentor
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토 상세 정보 조회
    getMentorDetail: async (req, res, next) => {
        try {
            const { mentorId } = req.params;
            const mentor = await communityService.getMentorDetail(mentorId);

            return res.status(200).json({
                success: true,
                data: mentor
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 멘토와 채팅 시작
    startMentorChat: async (req, res, next) => {
        try {
            const { mentorId } = req.params;
            const userId = req.user.id;

            const chat = await communityService.startMentorChat(mentorId, userId);

            return res.status(201).json({
                success: true,
                message: '멘토와의 채팅이 시작되었습니다.',
                data: chat
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = communityController;
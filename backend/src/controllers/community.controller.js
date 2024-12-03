const communityService = require('../services/community.service');
const { CustomError } = require('../utils/error.utils');

const communityController = {
    // 질문 유효성 검사
    async validateQuestion(req, res, next) {
        try {
            const { title, content } = req.body;
            await communityService.validateQuestion({ title, content });

            res.json({
                success: true,
                message: '유효한 질문입니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 400));
        }
    },

    // 질문 생성
    async createQuestion(req, res, next) {
        try {
            const { title, content } = req.body;
            const userId = req.user.id;

            const question = await communityService.createQuestion({
                title,
                content,
                memberId: userId
            });

            res.status(201).json({
                success: true,
                data: question
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 질문 목록 조회
    async getQuestions(req, res, next) {
        try {
            const { page = 1, limit = 10, sort = 'latest' } = req.query;
            const questions = await communityService.getQuestions({ page, limit, sort });

            res.json({
                success: true,
                data: questions
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 질문 상세 조회
    async getQuestion(req, res, next) {
        try {
            const { questionId } = req.params;
            const userId = req.user.id;

            const question = await communityService.getQuestion(questionId, userId);

            res.json({
                success: true,
                data: question
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 질문 수정
    async updateQuestion(req, res, next) {
        try {
            const { questionId } = req.params;
            const { title, content } = req.body;
            const userId = req.user.id;

            const question = await communityService.updateQuestion(questionId, {
                title,
                content,
                userId
            });

            res.json({
                success: true,
                data: question
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 질문 삭제
    async deleteQuestion(req, res, next) {
        try {
            const { questionId } = req.params;
            const userId = req.user.id;

            await communityService.deleteQuestion(questionId, userId);

            res.json({
                success: true,
                message: '질문이 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 답변 생성
    async createAnswer(req, res, next) {
        try {
            const { questionId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const answer = await communityService.createAnswer({
                questionId,
                content,
                memberId: userId
            });

            res.status(201).json({
                success: true,
                data: answer
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 답변 수정
    async updateAnswer(req, res, next) {
        try {
            const { answerId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const answer = await communityService.updateAnswer(answerId, {
                content,
                userId
            });

            res.json({
                success: true,
                data: answer
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 답변 삭제
    async deleteAnswer(req, res, next) {
        try {
            const { answerId } = req.params;
            const userId = req.user.id;

            await communityService.deleteAnswer(answerId, userId);

            res.json({
                success: true,
                message: '답변이 삭제되었습니다.'
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 스터디 그룹 생성
    async createStudyGroup(req, res, next) {
        try {
            const { name, category, description } = req.body;
            const userId = req.user.id;

            const group = await communityService.createStudyGroup({
                name,
                category,
                description,
                creatorId: userId
            });

            res.status(201).json({
                success: true,
                data: group
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 스터디 그룹 조회
    async getStudyGroup(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            const group = await communityService.getStudyGroup(groupId, userId);

            res.json({
                success: true,
                data: group
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멘토 등록
    async registerMentor(req, res, next) {
        try {
            const { field, experience, introduction } = req.body;
            const userId = req.user.id;

            const mentor = await communityService.registerMentor({
                field,
                experience,
                introduction,
                memberId: userId
            });

            res.status(201).json({
                success: true,
                data: mentor
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멘토 상세 정보 조회
    async getMentorDetail(req, res, next) {
        try {
            const { mentorId } = req.params;
            const mentor = await communityService.getMentorDetail(mentorId);

            res.json({
                success: true,
                data: mentor
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 멘토와 채팅 시작
    async startMentorChat(req, res, next) {
        try {
            const { mentorId } = req.params;
            const userId = req.user.id;

            const chat = await communityService.startMentorChat(mentorId, userId);

            res.status(201).json({
                success: true,
                data: chat
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 커뮤니티 데이터 조회
    async getData(req, res, next) {
        try {
            const { tab } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const userId = req.user.id;

            const data = await communityService.getData(tab, { page, limit, userId });

            res.json({
                success: true,
                data
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = communityController;
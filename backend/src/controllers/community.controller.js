const communityService = require('../services/community.service');

const communityController = {
    // 질문 유효성 검사
    validateQuestion: async (req, res) => {
        try {
            const result = await communityService.validateQuestion(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 질문 생성
    createQuestion: async (req, res) => {
        try {
            const result = await communityService.createQuestion(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 질문 목록 조회
    getQuestions: async (req, res) => {
        try {
            const result = await communityService.getQuestions(req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 질문 상세 조회
    getQuestion: async (req, res) => {
        try {
            const result = await communityService.getQuestion(req.params.questionId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 질문 수정
    updateQuestion: async (req, res) => {
        try {
            const result = await communityService.updateQuestion(req.params.questionId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 질문 삭제
    deleteQuestion: async (req, res) => {
        try {
            const result = await communityService.deleteQuestion(req.params.questionId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 답변 작성
    createAnswer: async (req, res) => {
        try {
            const result = await communityService.createAnswer(req.params.questionId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 답변 삭제
    deleteAnswer: async (req, res) => {
        try {
            const result = await communityService.deleteAnswer(req.params.answerId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 답변 수정
    updateAnswer: async (req, res) => {
        try {
            const result = await communityService.updateAnswer(req.params.answerId, req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 커뮤니티 데이터 조회
    getData: async (req, res) => {
        try {
            const result = await communityService.getData(req.params.tab);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 스터디 그룹 생성
    createStudyGroup: async (req, res) => {
        try {
            const result = await communityService.createStudyGroup(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 스터디 그룹 상세 조회
    getStudyGroup: async (req, res) => {
        try {
            const result = await communityService.getStudyGroup(req.params.groupId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토 등록
    registerMentor: async (req, res) => {
        try {
            const result = await communityService.registerMentor(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토 상세 조회
    getMentorDetail: async (req, res) => {
        try {
            const result = await communityService.getMentorDetail(req.params.mentorId);
            res.json(result);
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토링 채팅 시작
    startMentorChat: async (req, res) => {
        try {
            const result = await communityService.startMentorChat(req.params.mentorId);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = communityController;
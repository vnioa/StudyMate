const feedbackService = require('../services/feedback.service');

const feedbackController = {
    // 피드백 정보 조회
    getFeedback: async (req, res) => {
        try {
            const result = await feedbackService.getFeedback();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 자기 평가 이력 조회
    getSelfEvaluationHistory: async (req, res) => {
        try {
            const result = await feedbackService.getSelfEvaluationHistory();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 일지 이력 조회
    getJournalHistory: async (req, res) => {
        try {
            const result = await feedbackService.getJournalHistory();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // 자기 평가 저장
    saveSelfEvaluation: async (req, res) => {
        try {
            const result = await feedbackService.saveSelfEvaluation(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 학습 일지 저장
    saveJournal: async (req, res) => {
        try {
            const result = await feedbackService.saveJournal(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = feedbackController;
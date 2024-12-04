const feedbackService = require('../services/feedback.service');
const { CustomError } = require('../utils/error.utils');
const { RATING_RANGE } = require('../models/feedback.model');

const feedbackController = {
    // 피드백 정보 조회
    getFeedback: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const feedback = await feedbackService.getFeedback(userId);

            return res.status(200).json({
                success: true,
                message: '피드백 정보를 성공적으로 조회했습니다.',
                data: feedback
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 자기 평가 이력 조회
    getSelfEvaluationHistory: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            const history = await feedbackService.getSelfEvaluationHistory(userId, startDate, endDate);

            return res.status(200).json({
                success: true,
                message: '자기 평가 이력을 성공적으로 조회했습니다.',
                data: history
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 일지 이력 조회
    getJournalHistory: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            const history = await feedbackService.getJournalHistory(userId, startDate, endDate);

            return res.status(200).json({
                success: true,
                message: '학습 일지 이력을 성공적으로 조회했습니다.',
                data: history
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 자기 평가 저장
    saveSelfEvaluation: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { understanding, effort, efficiency, notes, date } = req.body;

            // 평가 점수 유효성 검사
            const ratings = [understanding, effort, efficiency];
            for (const rating of ratings) {
                if (rating < RATING_RANGE.MIN || rating > RATING_RANGE.MAX) {
                    throw new CustomError('평가 점수는 1-5 사이여야 합니다.', 400);
                }
            }

            const evaluation = await feedbackService.saveSelfEvaluation({
                memberId: userId,
                understanding,
                effort,
                efficiency,
                notes,
                date
            });

            return res.status(201).json({
                success: true,
                message: '자기 평가가 성공적으로 저장되었습니다.',
                data: evaluation
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    },

    // 학습 일지 저장
    saveJournal: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { date, content, achievements, difficulties, improvements, nextGoals } = req.body;

            const journal = await feedbackService.saveJournal({
                memberId: userId,
                date,
                content,
                achievements,
                difficulties,
                improvements,
                nextGoals
            });

            return res.status(201).json({
                success: true,
                message: '학습 일지가 성공적으로 저장되었습니다.',
                data: journal
            });
        } catch (error) {
            next(error.status ? error : new CustomError(error.message, 500));
        }
    }
};

module.exports = feedbackController;
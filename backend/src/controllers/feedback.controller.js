const feedbackService = require('../services/feedback.service');
const { CustomError } = require('../utils/error.utils');
const { RATING_RANGE } = require('../models/feedback.model');

const feedbackController = {
    // 피드백 정보 조회
    async getFeedback(req, res, next) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            const feedback = await feedbackService.getFeedback(userId, {
                startDate,
                endDate
            });

            res.json({
                success: true,
                data: feedback
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 자기 평가 저장
    async saveSelfEvaluation(req, res, next) {
        try {
            const {
                understanding,
                effort,
                efficiency,
                notes,
                date
            } = req.body;
            const userId = req.user.id;

            // 평가 점수 유효성 검증
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
                date: new Date(date)
            });

            res.status(201).json({
                success: true,
                data: evaluation
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 학습 일지 저장
    async saveJournal(req, res, next) {
        try {
            const {
                date,
                content,
                achievements,
                difficulties,
                improvements,
                nextGoals
            } = req.body;
            const userId = req.user.id;

            const journal = await feedbackService.saveJournal({
                memberId: userId,
                date: new Date(date),
                content,
                achievements,
                difficulties,
                improvements,
                nextGoals
            });

            res.status(201).json({
                success: true,
                data: journal
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 자기 평가 이력 조회
    async getSelfEvaluationHistory(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                page = 1,
                limit = 10,
                startDate,
                endDate,
                sortBy = 'date',
                order = 'DESC'
            } = req.query;

            const history = await feedbackService.getSelfEvaluationHistory(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                startDate,
                endDate,
                sortBy,
                order
            });

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    },

    // 학습 일지 이력 조회
    async getJournalHistory(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                page = 1,
                limit = 10,
                startDate,
                endDate,
                sortBy = 'date',
                order = 'DESC'
            } = req.query;

            const history = await feedbackService.getJournalHistory(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                startDate,
                endDate,
                sortBy,
                order
            });

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            next(new CustomError(error.message, error.status || 500));
        }
    }
};

module.exports = feedbackController;
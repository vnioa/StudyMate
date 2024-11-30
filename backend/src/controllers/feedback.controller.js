const db = require('../config/database');
const createError = require('http-errors');

const FeedbackController = {
    // 피드백 정보 조회
    getFeedback: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [[selfEvaluation], [studyJournal]] = await Promise.all([
                connection.query(
                    'SELECT * FROM self_evaluations WHERE user_id = ? ORDER BY date DESC LIMIT 1',
                    [req.user.id]
                ),
                connection.query(
                    'SELECT * FROM study_journals WHERE user_id = ? ORDER BY date DESC LIMIT 1',
                    [req.user.id]
                )
            ]);

            res.json({
                selfEvaluation: selfEvaluation || null,
                studyJournal: studyJournal || null
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 자기 평가 이력 조회
    getSelfEvaluationHistory: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [history] = await connection.query(
                'SELECT * FROM self_evaluations WHERE user_id = ? ORDER BY date DESC',
                [req.user.id]
            );
            res.json({ selfEval: history });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 일지 이력 조회
    getJournalHistory: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [history] = await connection.query(
                'SELECT * FROM study_journals WHERE user_id = ? ORDER BY date DESC',
                [req.user.id]
            );
            res.json({ journal: history });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 자기 평가 저장
    saveSelfEvaluation: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { understanding, effort, efficiency, notes, date } = req.body;

            await connection.query(
                `INSERT INTO self_evaluations
                     (user_id, understanding, effort, efficiency, notes, date)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [req.user.id, understanding, effort, efficiency, notes, date]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 일지 저장
    saveJournal: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { date, content, achievements, difficulties, improvements, nextGoals } = req.body;

            await connection.query(
                `INSERT INTO study_journals
                 (user_id, date, content, achievements, difficulties, improvements, next_goals)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [req.user.id, date, content, achievements, difficulties, improvements, nextGoals]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = FeedbackController;
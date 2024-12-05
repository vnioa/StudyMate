const db = require('../config/db');

// 유틸리티 함수
const utils = {
    async executeQuery(query, params) {
        try {
            const [results] = await db.execute(query, params);
            return results;
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error('데이터베이스 쿼리 실행 실패');
        }
    },

    async executeTransaction(callback) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    validateRating(rating) {
        const MIN_RATING = 1;
        const MAX_RATING = 5;
        return rating >= MIN_RATING && rating <= MAX_RATING;
    }
};

const feedbackController = {
    // 피드백 정보 조회
    getFeedback: async (req, res) => {
        try {
            const userId = req.user.id;

            const [evaluations, journals] = await Promise.all([
                utils.executeQuery(`
          SELECT * FROM self_evaluations 
          WHERE memberId = ? 
          ORDER BY date DESC LIMIT 5
        `, [userId]),
                utils.executeQuery(`
          SELECT * FROM study_journals 
          WHERE memberId = ? 
          ORDER BY date DESC LIMIT 5
        `, [userId])
            ]);

            res.status(200).json({
                success: true,
                message: '피드백 정보를 성공적으로 조회했습니다.',
                data: {
                    recentEvaluations: evaluations,
                    recentJournals: journals
                }
            });
        } catch (error) {
            console.error('피드백 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '피드백 정보 조회에 실패했습니다.'
            });
        }
    },

    // 자기 평가 이력 조회
    getSelfEvaluationHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            let query = `
        SELECT se.*, a.username, a.name
        FROM self_evaluations se
        JOIN auth a ON se.memberId = a.id
        WHERE se.memberId = ?
      `;
            const params = [userId];

            if (startDate && endDate) {
                query += ' AND se.date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            query += ' ORDER BY se.date DESC';

            const history = await utils.executeQuery(query, params);

            res.status(200).json({
                success: true,
                message: '자기 평가 이력을 성공적으로 조회했습니다.',
                data: history
            });
        } catch (error) {
            console.error('자기 평가 이력 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '자기 평가 이력 조회에 실패했습니다.'
            });
        }
    },

    // 학습 일지 이력 조회
    getJournalHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            let query = `
        SELECT sj.*, a.username, a.name
        FROM study_journals sj
        JOIN auth a ON sj.memberId = a.id
        WHERE sj.memberId = ?
      `;
            const params = [userId];

            if (startDate && endDate) {
                query += ' AND sj.date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            query += ' ORDER BY sj.date DESC';

            const history = await utils.executeQuery(query, params);

            res.status(200).json({
                success: true,
                message: '학습 일지 이력을 성공적으로 조회했습니다.',
                data: history
            });
        } catch (error) {
            console.error('학습 일지 이력 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 일지 이력 조회에 실패했습니다.'
            });
        }
    },

    // 자기 평가 저장
    saveSelfEvaluation: async (req, res) => {
        try {
            const userId = req.user.id;
            const { understanding, effort, efficiency, notes, date } = req.body;

            // 평가 점수 유효성 검사
            const ratings = [understanding, effort, efficiency];
            for (const rating of ratings) {
                if (!utils.validateRating(rating)) {
                    return res.status(400).json({
                        success: false,
                        message: '평가 점수는 1-5 사이여야 합니다.'
                    });
                }
            }

            const result = await utils.executeTransaction(async (connection) => {
                const [existingEvaluation] = await connection.execute(
                    'SELECT id FROM self_evaluations WHERE memberId = ? AND date = ?',
                    [userId, date]
                );

                if (existingEvaluation) {
                    await connection.execute(`
            UPDATE self_evaluations 
            SET understanding = ?, effort = ?, efficiency = ?, 
                notes = ?, updatedAt = NOW()
            WHERE id = ?
          `, [understanding, effort, efficiency, notes, existingEvaluation.id]);
                    return { id: existingEvaluation.id };
                }

                const [result] = await connection.execute(`
          INSERT INTO self_evaluations (
            memberId, date, understanding, effort, efficiency, 
            notes, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [userId, date, understanding, effort, efficiency, notes]);

                return { id: result.insertId };
            });

            res.status(201).json({
                success: true,
                message: '자기 평가가 성공적으로 저장되었습니다.',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('자기 평가 저장 오류:', error);
            res.status(500).json({
                success: false,
                message: '자기 평가 저장에 실패했습니다.'
            });
        }
    },

    // 학습 일지 저장
    saveJournal: async (req, res) => {
        try {
            const userId = req.user.id;
            const { date, content, achievements, difficulties, improvements, nextGoals } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [existingJournal] = await connection.execute(
                    'SELECT id FROM study_journals WHERE memberId = ? AND date = ?',
                    [userId, date]
                );

                if (existingJournal) {
                    await connection.execute(`
            UPDATE study_journals 
            SET content = ?, achievements = ?, difficulties = ?,
                improvements = ?, nextGoals = ?, updatedAt = NOW()
            WHERE id = ?
          `, [content, achievements, difficulties, improvements, nextGoals, existingJournal.id]);
                    return { id: existingJournal.id };
                }

                const [result] = await connection.execute(`
          INSERT INTO study_journals (
            memberId, date, content, achievements, difficulties,
            improvements, nextGoals, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [userId, date, content, achievements, difficulties, improvements, nextGoals]);

                return { id: result.insertId };
            });

            res.status(201).json({
                success: true,
                message: '학습 일지가 성공적으로 저장되었습니다.',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('학습 일지 저장 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 일지 저장에 실패했습니다.'
            });
        }
    }
};

module.exports = feedbackController;
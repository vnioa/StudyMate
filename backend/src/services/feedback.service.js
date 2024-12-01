const { dbUtils } = require('../config/db');

const feedbackService = {
    // 피드백 정보 조회
    async getFeedback() {
        try {
            // 최근 자기 평가 조회
            const selfEvalQuery = `
                SELECT * FROM self_evaluations
                WHERE userId = ?
                ORDER BY date DESC
                    LIMIT 1
            `;
            const [selfEvaluation] = await dbUtils.query(selfEvalQuery, [req.user.id]);

            // 최근 학습 일지 조회
            const journalQuery = `
                SELECT * FROM study_journals
                WHERE userId = ?
                ORDER BY date DESC
                    LIMIT 1
            `;
            const [studyJournal] = await dbUtils.query(journalQuery, [req.user.id]);

            return {
                selfEvaluation,
                studyJournal
            };
        } catch (error) {
            throw new Error('피드백 정보 조회 실패: ' + error.message);
        }
    },

    // 자기 평가 이력 조회
    async getSelfEvaluationHistory() {
        try {
            const query = `
                SELECT *,
                       (understanding + effort + efficiency) / 3 as averageScore
                FROM self_evaluations
                WHERE userId = ?
                ORDER BY date DESC
                    LIMIT 30
            `;

            const history = await dbUtils.query(query, [req.user.id]);

            return { selfEval: history };
        } catch (error) {
            throw new Error('자기 평가 이력 조회 실패: ' + error.message);
        }
    },

    // 학습 일지 이력 조회
    async getJournalHistory() {
        try {
            const query = `
                SELECT * FROM study_journals
                WHERE userId = ?
                ORDER BY date DESC
                    LIMIT 30
            `;

            const history = await dbUtils.query(query, [req.user.id]);

            return { journal: history };
        } catch (error) {
            throw new Error('학습 일지 이력 조회 실패: ' + error.message);
        }
    },

    // 자기 평가 저장
    async saveSelfEvaluation(data) {
        try {
            // 같은 날짜의 기존 평가 확인
            const [existingEval] = await dbUtils.query(
                'SELECT id FROM self_evaluations WHERE userId = ? AND date = ?',
                [req.user.id, data.date]
            );

            if (existingEval) {
                // 기존 평가 업데이트
                await dbUtils.query(`
                    UPDATE self_evaluations
                    SET understanding = ?,
                        effort = ?,
                        efficiency = ?,
                        notes = ?
                    WHERE id = ?
                `, [
                    data.understanding,
                    data.effort,
                    data.efficiency,
                    data.notes,
                    existingEval.id
                ]);
            } else {
                // 새 평가 생성
                await dbUtils.query(`
                    INSERT INTO self_evaluations (
                        userId, date, understanding, effort,
                        efficiency, notes
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    req.user.id,
                    data.date,
                    data.understanding,
                    data.effort,
                    data.efficiency,
                    data.notes
                ]);
            }

            return { success: true };
        } catch (error) {
            throw new Error('자기 평가 저장 실패: ' + error.message);
        }
    },

    // 학습 일지 저장
    async saveJournal(data) {
        try {
            // 같은 날짜의 기존 일지 확인
            const [existingJournal] = await dbUtils.query(
                'SELECT id FROM study_journals WHERE userId = ? AND date = ?',
                [req.user.id, data.date]
            );

            if (existingJournal) {
                // 기존 일지 업데이트
                await dbUtils.query(`
                    UPDATE study_journals
                    SET content = ?,
                        achievements = ?,
                        difficulties = ?,
                        improvements = ?,
                        nextGoals = ?
                    WHERE id = ?
                `, [
                    data.content,
                    data.achievements,
                    data.difficulties,
                    data.improvements,
                    data.nextGoals,
                    existingJournal.id
                ]);
            } else {
                // 새 일지 생성
                await dbUtils.query(`
                    INSERT INTO study_journals (
                        userId, date, content, achievements,
                        difficulties, improvements, nextGoals
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    req.user.id,
                    data.date,
                    data.content,
                    data.achievements,
                    data.difficulties,
                    data.improvements,
                    data.nextGoals
                ]);
            }

            return { success: true };
        } catch (error) {
            throw new Error('학습 일지 저장 실패: ' + error.message);
        }
    }
};

module.exports = feedbackService;
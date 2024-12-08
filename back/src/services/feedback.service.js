const { dbUtils } = require('../config/database.config');

const feedbackService = {
    // 피드백 정보 조회
    async getFeedback(userId) {
        try {
            const evaluationQuery = `
                SELECT *
                FROM self_evaluations
                WHERE memberId = ?
                ORDER BY date DESC
                LIMIT 5
            `;

            const journalQuery = `
                SELECT *
                FROM study_journals
                WHERE memberId = ?
                ORDER BY date DESC
                LIMIT 5
            `;

            const [evaluations, journals] = await Promise.all([
                dbUtils.query(evaluationQuery, [userId]),
                dbUtils.query(journalQuery, [userId])
            ]);

            return {
                recentEvaluations: evaluations,
                recentJournals: journals
            };
        } catch (error) {
            throw new Error('피드백 정보 조회 실패: ' + error.message);
        }
    },

    // 자기 평가 이력 조회
    async getSelfEvaluationHistory(userId, startDate, endDate) {
        try {
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

            return await dbUtils.query(query, params);
        } catch (error) {
            throw new Error('자기 평가 이력 조회 실패: ' + error.message);
        }
    },

    // 학습 일지 이력 조회
    async getJournalHistory(userId, startDate, endDate) {
        try {
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

            return await dbUtils.query(query, params);
        } catch (error) {
            throw new Error('학습 일지 이력 조회 실패: ' + error.message);
        }
    },

    // 자기 평가 저장
    async saveSelfEvaluation(evaluationData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 같은 날짜의 평가가 있는지 확인
                const [existingEvaluation] = await connection.query(
                    'SELECT id FROM self_evaluations WHERE memberId = ? AND date = ?',
                    [evaluationData.memberId, evaluationData.date]
                );

                if (existingEvaluation) {
                    // 기존 평가 업데이트
                    await connection.query(`
                        UPDATE self_evaluations
                        SET understanding = ?,
                            effort = ?,
                            efficiency = ?,
                            notes = ?,
                            updatedAt = NOW()
                        WHERE id = ?
                    `, [
                        evaluationData.understanding,
                        evaluationData.effort,
                        evaluationData.efficiency,
                        evaluationData.notes,
                        existingEvaluation.id
                    ]);

                    return { id: existingEvaluation.id, ...evaluationData };
                }

                // 새로운 평가 생성
                const [result] = await connection.query(`
                    INSERT INTO self_evaluations (
                        memberId, date, understanding, effort,
                        efficiency, notes, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    evaluationData.memberId,
                    evaluationData.date,
                    evaluationData.understanding,
                    evaluationData.effort,
                    evaluationData.efficiency,
                    evaluationData.notes
                ]);

                return { id: result.insertId, ...evaluationData };
            } catch (error) {
                throw new Error('자기 평가 저장 실패: ' + error.message);
            }
        });
    },

    // 학습 일지 저장
    async saveJournal(journalData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 같은 날짜의 일지가 있는지 확인
                const [existingJournal] = await connection.query(
                    'SELECT id FROM study_journals WHERE memberId = ? AND date = ?',
                    [journalData.memberId, journalData.date]
                );

                if (existingJournal) {
                    // 기존 일지 업데이트
                    await connection.query(`
                        UPDATE study_journals
                        SET content = ?,
                            achievements = ?,
                            difficulties = ?,
                            improvements = ?,
                            nextGoals = ?,
                            updatedAt = NOW()
                        WHERE id = ?
                    `, [
                        journalData.content,
                        journalData.achievements,
                        journalData.difficulties,
                        journalData.improvements,
                        journalData.nextGoals,
                        existingJournal.id
                    ]);

                    return { id: existingJournal.id, ...journalData };
                }

                // 새로운 일지 생성
                const [result] = await connection.query(`
                    INSERT INTO study_journals (
                        memberId, date, content, achievements,
                        difficulties, improvements, nextGoals,
                        createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    journalData.memberId,
                    journalData.date,
                    journalData.content,
                    journalData.achievements,
                    journalData.difficulties,
                    journalData.improvements,
                    journalData.nextGoals
                ]);

                return { id: result.insertId, ...journalData };
            } catch (error) {
                throw new Error('학습 일지 저장 실패: ' + error.message);
            }
        });
    }
};

module.exports = feedbackService;
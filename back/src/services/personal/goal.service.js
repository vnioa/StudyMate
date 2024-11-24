const db = require('../config/mysql');

class GoalService {
    // 학습 목표 생성
    async createGoal(userId, goalData) {
        try {
            const { title, description, targetDate, type } = goalData;

            const [result] = await db.execute(
                'INSERT INTO study_goals (user_id, title, description, target_date, type) VALUES (?, ?, ?, ?, ?)',
                [userId, title, description, targetDate, type]
            );

            return result.insertId;
        } catch (error) {
            console.error('목표 생성 오류:', error);
            throw new Error('목표 생성에 실패했습니다.');
        }
    }

    // 목표 진행 상황 업데이트
    async updateProgress(goalId, userId, progress) {
        try {
            await db.execute(
                'UPDATE study_goals SET progress = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
                [progress, goalId, userId]
            );

            return true;
        } catch (error) {
            console.error('진행 상황 업데이트 오류:', error);
            throw new Error('진행 상황 업데이트에 실패했습니다.');
        }
    }

    // 목표 목록 조회
    async getGoals(userId, type) {
        try {
            let query = 'SELECT * FROM study_goals WHERE user_id = ?';
            const params = [userId];

            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            query += ' ORDER BY target_date ASC';

            const [goals] = await db.execute(query, params);
            return goals;
        } catch (error) {
            console.error('목표 목록 조회 오류:', error);
            throw new Error('목표 목록 조회에 실패했습니다.');
        }
    }

    // 목표 삭제
    async deleteGoal(goalId, userId) {
        try {
            await db.execute(
                'DELETE FROM study_goals WHERE id = ? AND user_id = ?',
                [goalId, userId]
            );

            return true;
        } catch (error) {
            console.error('목표 삭제 오류:', error);
            throw new Error('목표 삭제에 실패했습니다.');
        }
    }

    // 목표 마일스톤 업데이트
    async updateMilestones(goalId, milestones) {
        try {
            await db.execute(
                'UPDATE study_goals SET milestones = ? WHERE id = ?',
                [JSON.stringify(milestones), goalId]
            );

            return true;
        } catch (error) {
            console.error('마일스톤 업데이트 오류:', error);
            throw new Error('마일스톤 업데이트에 실패했습니다.');
        }
    }
}

module.exports = new GoalService();
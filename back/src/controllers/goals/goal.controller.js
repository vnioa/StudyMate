const db = require('../../config/mysql');

class GoalController {
    // 학습 목표 생성
    async createGoal(req, res) {
        try {
            const { userId, title, description, targetDate, type } = req.body;

            const [result] = await db.execute(
                'INSERT INTO study_goals (user_id, title, description, target_date, type) VALUES (?, ?, ?, ?, ?)',
                [userId, title, description, targetDate, type]
            );

            res.status(201).json({
                success: true,
                goalId: result.insertId,
                message: '학습 목표가 생성되었습니다.'
            });
        } catch (error) {
            console.error('목표 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 생성에 실패했습니다.'
            });
        }
    }

    // 목표 진행 상황 업데이트
    async updateProgress(req, res) {
        try {
            const { goalId } = req.params;
            const { progress } = req.body;
            const userId = req.user.id;

            await db.execute(
                'UPDATE study_goals SET progress = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
                [progress, goalId, userId]
            );

            res.status(200).json({
                success: true,
                message: '진행 상황이 업데이트되었습니다.'
            });
        } catch (error) {
            console.error('진행 상황 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '진행 상황 업데이트에 실패했습니다.'
            });
        }
    }

    // 목표 목록 조회
    async getGoals(req, res) {
        try {
            const { userId, type } = req.query;
            let query = 'SELECT * FROM study_goals WHERE user_id = ?';
            const params = [userId];

            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            query += ' ORDER BY target_date ASC';

            const [goals] = await db.execute(query, params);

            res.status(200).json({
                success: true,
                goals
            });
        } catch (error) {
            console.error('목표 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 목록 조회에 실패했습니다.'
            });
        }
    }

    // 목표 삭제
    async deleteGoal(req, res) {
        try {
            const { goalId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'DELETE FROM study_goals WHERE id = ? AND user_id = ?',
                [goalId, userId]
            );

            res.status(200).json({
                success: true,
                message: '목표가 삭제되었습니다.'
            });
        } catch (error) {
            console.error('목표 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '목표 삭제에 실패했습니다.'
            });
        }
    }
}

module.exports = new GoalController();
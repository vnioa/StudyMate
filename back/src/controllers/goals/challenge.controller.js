const db = require('../config/mysql');

class ChallengeController {
    // 챌린지 생성
    async createChallenge(req, res) {
        try {
            const { title, description, startDate, endDate, goalType, targetValue } = req.body;
            const creatorId = req.user.id;

            const [result] = await db.execute(
                'INSERT INTO study_challenges (creator_id, title, description, start_date, end_date, goal_type, target_value) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [creatorId, title, description, startDate, endDate, goalType, targetValue]
            );

            res.status(201).json({
                success: true,
                challengeId: result.insertId,
                message: '새로운 챌린지가 생성되었습니다.'
            });
        } catch (error) {
            console.error('챌린지 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '챌린지 생성에 실패했습니다.'
            });
        }
    }

    // 챌린지 참여
    async joinChallenge(req, res) {
        try {
            const { challengeId } = req.params;
            const userId = req.user.id;

            await db.execute(
                'INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)',
                [challengeId, userId]
            );

            res.status(200).json({
                success: true,
                message: '챌린지 참여가 완료되었습니다.'
            });
        } catch (error) {
            console.error('챌린지 참여 오류:', error);
            res.status(500).json({
                success: false,
                message: '챌린지 참여에 실패했습니다.'
            });
        }
    }

    // 챌린지 진행 상황 업데이트
    async updateProgress(req, res) {
        try {
            const { challengeId } = req.params;
            const { progress } = req.body;
            const userId = req.user.id;

            await db.execute(
                'UPDATE challenge_participants SET progress = ?, updated_at = NOW() WHERE challenge_id = ? AND user_id = ?',
                [progress, challengeId, userId]
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

    // 챌린지 랭킹 조회
    async getChallengeRanking(req, res) {
        try {
            const { challengeId } = req.params;

            const [ranking] = await db.execute(
                `SELECT u.name, cp.progress, cp.updated_at
                 FROM challenge_participants cp
                          JOIN users u ON cp.user_id = u.id
                 WHERE cp.challenge_id = ?
                 ORDER BY cp.progress DESC`,
                [challengeId]
            );

            res.status(200).json({
                success: true,
                ranking
            });
        } catch (error) {
            console.error('랭킹 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '랭킹 조회에 실패했습니다.'
            });
        }
    }
}

module.exports = new ChallengeController();
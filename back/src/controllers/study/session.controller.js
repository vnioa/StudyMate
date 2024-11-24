const db = require('../config/mysql');

class SessionController {
    // 학습 세션 시작
    async startSession(req, res) {
        try {
            const { userId, subject, studyType } = req.body;

            const [result] = await db.execute(
                'INSERT INTO study_sessions (user_id, subject, study_type, start_time) VALUES (?, ?, ?, NOW())',
                [userId, subject, studyType]
            );

            res.status(201).json({
                success: true,
                sessionId: result.insertId,
                message: '학습 세션이 시작되었습니다.'
            });
        } catch (error) {
            console.error('세션 시작 오류:', error);
            res.status(500).json({
                success: false,
                message: '세션 시작에 실패했습니다.'
            });
        }
    }

    // 학습 세션 종료
    async endSession(req, res) {
        try {
            const { sessionId } = req.params;
            const { duration, notes } = req.body;

            await db.execute(
                'UPDATE study_sessions SET end_time = NOW(), duration = ?, notes = ? WHERE id = ?',
                [duration, notes, sessionId]
            );

            res.status(200).json({
                success: true,
                message: '학습 세션이 종료되었습니다.'
            });
        } catch (error) {
            console.error('세션 종료 오류:', error);
            res.status(500).json({
                success: false,
                message: '세션 종료에 실패했습니다.'
            });
        }
    }

    // 학습 세션 목록 조회
    async getSessions(req, res) {
        try {
            const { userId, startDate, endDate } = req.query;

            const [sessions] = await db.execute(
                `SELECT * FROM study_sessions 
         WHERE user_id = ? 
         AND start_time BETWEEN ? AND ?
         ORDER BY start_time DESC`,
                [userId, startDate, endDate]
            );

            res.status(200).json({
                success: true,
                sessions
            });
        } catch (error) {
            console.error('세션 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '세션 목록 조회에 실패했습니다.'
            });
        }
    }

    // 포모도로 타이머 설정
    async setPomodoroTimer(req, res) {
        try {
            const { userId, duration, breakTime } = req.body;

            await db.execute(
                'INSERT INTO pomodoro_settings (user_id, duration, break_time) VALUES (?, ?, ?)',
                [userId, duration, breakTime]
            );

            res.status(200).json({
                success: true,
                message: '포모도로 타이머가 설정되었습니다.'
            });
        } catch (error) {
            console.error('포모도로 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '포모도로 설정에 실패했습니다.'
            });
        }
    }
}

module.exports = new SessionController();
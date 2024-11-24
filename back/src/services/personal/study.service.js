const db = require('../../config/mysql');

class StudyService {
    // 학습 세션 시작
    async startSession(userId, sessionData) {
        try {
            const { subject, studyType } = sessionData;

            const [result] = await db.execute(
                'INSERT INTO study_sessions (user_id, subject, study_type, start_time) VALUES (?, ?, ?, NOW())',
                [userId, subject, studyType]
            );

            return result.insertId;
        } catch (error) {
            console.error('세션 시작 오류:', error);
            throw new Error('세션 시작에 실패했습니다.');
        }
    }

    // 학습 세션 종료
    async endSession(sessionId, sessionData) {
        try {
            const { duration, notes } = sessionData;

            await db.execute(
                'UPDATE study_sessions SET end_time = NOW(), duration = ?, notes = ? WHERE id = ?',
                [duration, notes, sessionId]
            );

            return true;
        } catch (error) {
            console.error('세션 종료 오류:', error);
            throw new Error('세션 종료에 실패했습니다.');
        }
    }

    // 학습 세션 목록 조회
    async getSessions(userId, startDate, endDate) {
        try {
            const [sessions] = await db.execute(
                `SELECT * FROM study_sessions
                 WHERE user_id = ?
                   AND start_time BETWEEN ? AND ?
                 ORDER BY start_time DESC`,
                [userId, startDate, endDate]
            );

            return sessions;
        } catch (error) {
            console.error('세션 목록 조회 오류:', error);
            throw new Error('세션 목록 조회에 실패했습니다.');
        }
    }

    // 포모도로 타이머 설정
    async setPomodoroTimer(userId, timerData) {
        try {
            const { duration, breakTime } = timerData;

            await db.execute(
                'INSERT INTO pomodoro_settings (user_id, duration, break_time) VALUES (?, ?, ?)',
                [userId, duration, breakTime]
            );

            return true;
        } catch (error) {
            console.error('포모도로 설정 오류:', error);
            throw new Error('포모도로 설정에 실패했습니다.');
        }
    }

    // 학습 통계 조회
    async getStudyStats(userId) {
        try {
            const [stats] = await db.execute(
                `SELECT
                     COUNT(*) as total_sessions,
                     SUM(duration) as total_time,
                     AVG(duration) as avg_duration
                 FROM study_sessions
                 WHERE user_id = ?`,
                [userId]
            );

            return stats[0];
        } catch (error) {
            console.error('학습 통계 조회 오류:', error);
            throw new Error('학습 통계 조회에 실패했습니다.');
        }
    }
}

module.exports = new StudyService();
const db = require('../config/mysql');
const createError = require('http-errors');

const StudyController = {
    // 대시보드 데이터 조회
    getDashboardData: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [[todayStats], [level], [streak], [schedules], [goals], [weeklyStats]] = await Promise.all([
                connection.query(
                    'SELECT * FROM daily_stats WHERE user_id = ? AND date = CURDATE()',
                    [req.user.id]
                ),
                connection.query(
                    'SELECT * FROM user_levels WHERE user_id = ?',
                    [req.user.id]
                ),
                connection.query(
                    'SELECT * FROM study_streaks WHERE user_id = ? AND is_active = true',
                    [req.user.id]
                ),
                connection.query(
                    'SELECT * FROM study_schedules WHERE user_id = ? AND date >= CURDATE() ORDER BY start_time LIMIT 5',
                    [req.user.id]
                ),
                connection.query(
                    'SELECT * FROM study_goals WHERE user_id = ? AND status = "active"',
                    [req.user.id]
                ),
                connection.query(
                    `SELECT DATE_FORMAT(date, '%Y-%m-%d') as label, study_time as value 
           FROM daily_stats 
           WHERE user_id = ? 
           AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
           ORDER BY date`,
                    [req.user.id]
                )
            ]);

            res.json({
                success: true,
                dashboard: {
                    todayStats: todayStats[0] || {},
                    level: level[0],
                    streak: streak[0],
                    schedule: schedules,
                    goals,
                    weeklyStats,
                    growthRate: calculateGrowthRate(weeklyStats)
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 세션 시작
    startStudySession: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [result] = await connection.query(
                'INSERT INTO study_sessions (user_id, start_time) VALUES (?, NOW())',
                [req.user.id]
            );

            res.json({
                success: true,
                sessionId: result.insertId
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 세션 종료
    endStudySession: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { sessionId } = req.params;

            await connection.beginTransaction();

            const [session] = await connection.query(
                'SELECT start_time FROM study_sessions WHERE id = ? AND user_id = ?',
                [sessionId, req.user.id]
            );

            if (!session.length) {
                throw createError(404, '세션을 찾을 수 없습니다.');
            }

            const duration = Math.floor((Date.now() - session[0].start_time) / 1000);

            await connection.query(
                'UPDATE study_sessions SET end_time = NOW(), duration = ? WHERE id = ?',
                [duration, sessionId]
            );

            await connection.commit();
            res.json({ success: true, duration });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 통계 조회
    getStatistics: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { startDate, endDate } = req.query;
            const [statistics] = await connection.query(
                `SELECT 
           SUM(study_time) as total_time,
           AVG(focus_rate) as avg_focus,
           COUNT(DISTINCT date) as study_days
         FROM daily_stats 
         WHERE user_id = ? 
         AND date BETWEEN ? AND ?`,
                [req.user.id, startDate, endDate]
            );

            res.json({
                success: true,
                statistics: statistics[0]
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 자료 관리
    uploadMaterial: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            if (!req.file) {
                throw createError(400, '파일이 없습니다.');
            }

            const { title, description, subject } = req.body;
            const fileUrl = req.file.path;

            const [result] = await connection.query(
                'INSERT INTO study_materials (user_id, title, description, subject, file_url) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, title, description, subject, fileUrl]
            );

            res.json({
                success: true,
                material: {
                    id: result.insertId,
                    title,
                    description,
                    subject,
                    fileUrl
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 피드백 저장
    saveJournal: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { content, achievements, difficulties, improvements, nextGoals } = req.body;

            await connection.query(
                `INSERT INTO study_journals 
         (user_id, content, achievements, difficulties, improvements, next_goals) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [req.user.id, content, achievements, difficulties, improvements, nextGoals]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

// 성장률 계산 헬퍼 함수
const calculateGrowthRate = (weeklyStats) => {
    if (weeklyStats.length < 2) return 0;

    const lastWeek = weeklyStats.slice(-7);
    const prevWeek = weeklyStats.slice(-14, -7);

    const lastWeekAvg = lastWeek.reduce((sum, stat) => sum + stat.value, 0) / lastWeek.length;
    const prevWeekAvg = prevWeek.reduce((sum, stat) => sum + stat.value, 0) / prevWeek.length;

    if (prevWeekAvg === 0) return 0;
    return ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100;
};

module.exports = StudyController;
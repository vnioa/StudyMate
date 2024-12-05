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
    }
};

const studyController = {
    // 대시보드 데이터 조회
    getDashboardData: async (req, res) => {
        try {
            const userId = req.user.id;

            const [dashboardData] = await utils.executeQuery(`
        SELECT COUNT(DISTINCT ss.id) as totalSessions, 
               SUM(ss.totalTime) as totalStudyTime,
               AVG(se.understanding) as avgUnderstanding,
               AVG(se.efficiency) as avgEfficiency
        FROM study_sessions ss
        LEFT JOIN self_evaluations se ON ss.id = se.sessionId
        WHERE ss.memberId = ? AND ss.status = 'completed'
      `, [userId]);

            res.status(200).json({
                success: true,
                data: dashboardData
            });
        } catch (error) {
            console.error('대시보드 데이터 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '대시보드 데이터 조회에 실패했습니다.'
            });
        }
    },

    // 학습 세션 시작
    startStudySession: async (req, res) => {
        try {
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [session] = await connection.execute(`
          INSERT INTO study_sessions (
            memberId, startTime, status, createdAt
          ) VALUES (?, NOW(), 'active', NOW())
        `, [userId]);

                return { id: session.insertId, startTime: new Date() };
            });

            res.status(201).json({
                success: true,
                message: '학습 세션이 시작되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('학습 세션 시작 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 세션 시작에 실패했습니다.'
            });
        }
    },

    // 학습 세션 종료
    endStudySession: async (req, res) => {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [session] = await connection.execute(
                    'SELECT * FROM study_sessions WHERE id = ? AND memberId = ?',
                    [sessionId, userId]
                );

                if (!session) {
                    throw new Error('세션을 찾을 수 없습니다.');
                }

                const endTime = new Date();
                const totalTime = Math.floor((endTime - new Date(session.startTime)) / 60000);

                await connection.execute(`
          UPDATE study_sessions 
          SET endTime = ?, totalTime = ?, status = 'completed', updatedAt = NOW()
          WHERE id = ?
        `, [endTime, totalTime, sessionId]);

                return { id: sessionId, totalTime, endTime };
            });

            res.status(200).json({
                success: true,
                message: '학습 세션이 종료되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('학습 세션 종료 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 세션 종료에 실패했습니다.'
            });
        }
    },

    // 세션 통계 조회
    getSessionStats: async (req, res) => {
        try {
            const userId = req.user.id;

            const stats = await utils.executeQuery(`
        SELECT DATE(startTime) as date,
               COUNT(*) as sessionCount,
               SUM(totalTime) as totalTime,
               AVG(cycles) as avgCycles
        FROM study_sessions
        WHERE memberId = ? AND status = 'completed'
        GROUP BY DATE(startTime)
        ORDER BY date DESC
        LIMIT 30
      `, [userId]);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('세션 통계 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '세션 통계 조회에 실패했습니다.'
            });
        }
    },

    // 일정 검색
    searchSchedules: async (req, res) => {
        try {
            const userId = req.user.id;
            const { query, type } = req.query;

            let sqlQuery = `
        SELECT s.*, u.username as authorName
        FROM schedules s
        JOIN auth u ON s.memberId = u.id
        WHERE s.memberId = ? 
        AND s.deletedAt IS NULL
        AND (s.title LIKE ? OR s.content LIKE ?)
      `;
            const params = [userId, `%${query}%`, `%${query}%`];

            if (type) {
                sqlQuery += ' AND s.type = ?';
                params.push(type);
            }

            sqlQuery += ' ORDER BY s.startTime DESC';

            const schedules = await utils.executeQuery(sqlQuery, params);

            res.status(200).json({
                success: true,
                data: schedules
            });
        } catch (error) {
            console.error('일정 검색 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 검색에 실패했습니다.'
            });
        }
    },

    // 일정 공유
    shareSchedule: async (req, res) => {
        try {
            const userId = req.user.id;
            const { scheduleId } = req.params;
            const { sharedWith, permissions } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [schedule] = await connection.execute(
                    'SELECT * FROM schedules WHERE id = ? AND memberId = ?',
                    [scheduleId, userId]
                );

                if (!schedule) {
                    throw new Error('일정을 찾을 수 없거나 권한이 없습니다.');
                }

                await connection.execute(
                    'DELETE FROM schedule_shares WHERE scheduleId = ?',
                    [scheduleId]
                );

                if (sharedWith?.length) {
                    const shareValues = sharedWith.map(memberId => [
                        scheduleId,
                        memberId,
                        permissions[memberId] || 'view'
                    ]);

                    await connection.execute(`
            INSERT INTO schedule_shares (scheduleId, memberId, permission)
            VALUES ?
          `, [shareValues]);
                }

                return { success: true };
            });

            res.status(200).json({
                success: true,
                message: '일정이 공유되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('일정 공유 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 공유에 실패했습니다.'
            });
        }
    },

    // 일정 버전 업데이트
    updateVersion: async (req, res) => {
        try {
            const userId = req.user.id;
            const { scheduleId } = req.params;
            const versionData = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [schedule] = await connection.execute(
                    'SELECT * FROM schedules WHERE id = ? AND memberId = ?',
                    [scheduleId, userId]
                );

                if (!schedule) {
                    throw new Error('일정을 찾을 수 없거나 권한이 없습니다.');
                }

                await connection.execute(`
          INSERT INTO schedule_versions (
            scheduleId, version, content, updatedBy, 
            changes, commitMessage, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
                    scheduleId,
                    schedule.version,
                    schedule.content,
                    userId,
                    versionData.changes || '일정 업데이트',
                    versionData.commitMessage || '내용 수정'
                ]);

                await connection.execute(`
          UPDATE schedules 
          SET version = version + 1,
              content = ?,
              updatedAt = NOW()
          WHERE id = ?
        `, [versionData.content, scheduleId]);

                return {
                    id: scheduleId,
                    version: schedule.version + 1,
                    content: versionData.content
                };
            });

            res.status(200).json({
                success: true,
                message: '일정 버전이 업데이트되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('일정 버전 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '일정 버전 업데이트에 실패했습니다.'
            });
        }
    }
};

module.exports = studyController;
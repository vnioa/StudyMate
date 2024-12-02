const { StudySession, StudySchedule, StudyJournal, SelfEvaluation, StudyMaterial } = require('../models');
const { dbUtils } = require('../config/db');
const {uploadFile, deleteFile} = require('../utils/fileUpload')

const studyService = {
    // 대시보드 데이터 조회
    async getDashboardData(userId) {
        try {
            const query = `
                SELECT
                    COUNT(DISTINCT ss.id) as totalSessions,
                    SUM(ss.totalTime) as totalStudyTime,
                    AVG(se.understanding) as avgUnderstanding,
                    COUNT(DISTINCT sj.id) as journalCount
                FROM study_sessions ss
                         LEFT JOIN self_evaluations se ON ss.id = se.sessionId
                         LEFT JOIN study_journals sj ON ss.userId = sj.userId
                WHERE ss.userId = ?
            `;
            const [stats] = await dbUtils.query(query, [userId]);

            return { stats };
        } catch (error) {
            throw new Error('대시보드 데이터 조회 실패: ' + error.message);
        }
    },

    // 추천 콘텐츠 조회
    async getRecommendations(userId) {
        try {
            const query = `
                SELECT ss.*, sj.content as journalContent,
                       se.understanding, se.effort
                FROM study_sessions ss
                         LEFT JOIN study_journals sj ON ss.userId = sj.userId
                         LEFT JOIN self_evaluations se ON ss.id = se.sessionId
                WHERE ss.userId = ?
                ORDER BY ss.createdAt DESC
                    LIMIT 5
            `;
            const recentStudies = await dbUtils.query(query, [userId]);

            // 학습 패턴 분석을 통한 추천
            const recommendations = {
                timeSlots: [],
                subjects: [],
                materials: []
            };

            return { recommendations, recentStudies };
        } catch (error) {
            throw new Error('추천 콘텐츠 조회 실패: ' + error.message);
        }
    },

    // 학습 세션 시작
    async startStudySession(userId) {
        try {
            const query = `
                INSERT INTO study_sessions (userId, startTime)
                VALUES (?, NOW())
            `;
            const [result] = await dbUtils.query(query, [userId]);

            return { sessionId: result.insertId };
        } catch (error) {
            throw new Error('학습 세션 시작 실패: ' + error.message);
        }
    },

    // 학습 세션 종료
    async endStudySession(sessionId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [session] = await connection.query(
                    'SELECT startTime FROM study_sessions WHERE id = ? AND userId = ?',
                    [sessionId, userId]
                );

                if (!session) {
                    throw new Error('세션을 찾을 수 없습니다');
                }

                const endTime = new Date();
                const totalTime = Math.floor((endTime - session.startTime) / 60000);

                await connection.query(`
                    UPDATE study_sessions
                    SET endTime = ?,
                        totalTime = ?
                    WHERE id = ?
                `, [endTime, totalTime, sessionId]);

                return { success: true, totalTime };
            } catch (error) {
                throw new Error('학습 세션 종료 실패: ' + error.message);
            }
        });
    },

    // 학습 통계 조회
    async getStatistics(userId, params) {
        try {
            const { startDate, endDate } = params;
            const query = `
                SELECT
                    DATE(startTime) as date,
                    COUNT(*) as sessionCount,
                    SUM(totalTime) as totalTime,
                    AVG(cycles) as avgCycles
                FROM study_sessions
                WHERE userId = ?
                  AND startTime BETWEEN ? AND ?
                GROUP BY DATE(startTime)
                ORDER BY date DESC
            `;
            const stats = await dbUtils.query(query, [userId, startDate, endDate]);

            return { stats };
        } catch (error) {
            throw new Error('학습 통계 조회 실패: ' + error.message);
        }
    },

    // 학습 일정 조회
    async getSchedules(userId, date) {
        try {
            const query = `
                SELECT * FROM study_schedules
                WHERE userId = ?
                  AND DATE(startTime) = DATE(?)
                ORDER BY startTime ASC
            `;
            const schedules = await dbUtils.query(query, [userId, date]);

            return { schedules };
        } catch (error) {
            throw new Error('학습 일정 조회 실패: ' + error.message);
        }
    },

    // 학습 일정 생성
    async createSchedule(userId, data) {
        try {
            const query = `
                INSERT INTO study_schedules
                    (userId, title, startTime, endTime, repeat, notification, shared)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await dbUtils.query(query, [
                userId,
                data.title,
                data.startTime,
                data.endTime,
                data.repeat,
                data.notification,
                data.shared
            ]);

            return { scheduleId: result.insertId };
        } catch (error) {
            throw new Error('학습 일정 생성 실패: ' + error.message);
        }
    },

    // 학습 일지 저장
    async saveJournal(userId, data) {
        try {
            const query = `
                INSERT INTO study_journals
                    (userId, content, achievements, difficulties, improvements, nextGoals)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await dbUtils.query(query, [
                userId,
                data.content,
                data.achievements,
                data.difficulties,
                data.improvements,
                data.nextGoals
            ]);

            return { journalId: result.insertId };
        } catch (error) {
            throw new Error('학습 일지 저장 실패: ' + error.message);
        }
    },

    // 자기 평가 저장
    async saveSelfEvaluation(sessionId, data) {
        try {
            const query = `
                INSERT INTO self_evaluations
                    (sessionId, understanding, effort, efficiency, notes)
                VALUES (?, ?, ?, ?, ?)
            `;
            await dbUtils.query(query, [
                sessionId,
                data.understanding,
                data.effort,
                data.efficiency,
                data.notes
            ]);

            return { success: true };
        } catch (error) {
            throw new Error('자기 평가 저장 실패: ' + error.message);
        }
    },

    // 학습 분석 데이터 조회
    async getAnalytics(userId, timeRange) {
        try {
            const query = `
                SELECT
                    DATE(startTime) as date,
                    SUM(totalTime) as totalStudyTime,
                    COUNT(*) as sessionCount,
                    AVG(se.understanding) as avgUnderstanding,
                    AVG(se.effort) as avgEffort
                FROM study_sessions ss
                    LEFT JOIN self_evaluations se ON ss.id = se.sessionId
                WHERE ss.userId = ?
                GROUP BY DATE(startTime)
                ORDER BY date DESC
                    LIMIT ?
            `;
            const analytics = await dbUtils.query(query, [userId, timeRange]);

            return { analytics };
        } catch (error) {
            throw new Error('학습 분석 데이터 조회 실패: ' + error.message);
        }
    },

// 과목별 분석 데이터 조회
    async getSubjectAnalytics(userId, subjectId, timeRange) {
        try {
            const query = `
                SELECT
                    ss.*,
                    se.understanding,
                    se.effort,
                    se.efficiency
                FROM study_sessions ss
                         LEFT JOIN self_evaluations se ON ss.id = se.sessionId
                WHERE ss.userId = ?
                  AND ss.subjectId = ?
                  AND ss.startTime >= DATE_SUB(NOW(), INTERVAL ? DAY)
                ORDER BY ss.startTime DESC
            `;
            const analytics = await dbUtils.query(query, [userId, subjectId, timeRange]);

            return { analytics };
        } catch (error) {
            throw new Error('과목별 분석 데이터 조회 실패: ' + error.message);
        }
    },

// 학습 일정 수정
    async updateSchedule(scheduleId, userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [schedule] = await connection.query(
                    'SELECT * FROM study_schedules WHERE id = ? AND userId = ?',
                    [scheduleId, userId]
                );

                if (!schedule) {
                    throw new Error('일정을 찾을 수 없습니다');
                }

                await connection.query(`
                    UPDATE study_schedules
                    SET title = ?,
                        startTime = ?,
                        endTime = ?,
                        repeat = ?,
                        notification = ?,
                        shared = ?
                    WHERE id = ?
                `, [
                    data.title,
                    data.startTime,
                    data.endTime,
                    data.repeat,
                    data.notification,
                    data.shared,
                    scheduleId
                ]);

                return { success: true };
            } catch (error) {
                throw new Error('학습 일정 수정 실패: ' + error.message);
            }
        });
    },

// 학습 일정 삭제
    async deleteSchedule(scheduleId, userId) {
        try {
            const result = await dbUtils.query(
                'DELETE FROM study_schedules WHERE id = ? AND userId = ?',
                [scheduleId, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('일정을 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('학습 일정 삭제 실패: ' + error.message);
        }
    },

// 피드백 정보 조회
    async getFeedback(userId) {
        try {
            const query = `
                SELECT sj.*, se.understanding, se.effort, se.efficiency
                FROM study_journals sj
                         LEFT JOIN self_evaluations se ON sj.userId = se.userId
                WHERE sj.userId = ?
                ORDER BY sj.createdAt DESC
                    LIMIT 10
            `;
            const feedback = await dbUtils.query(query, [userId]);

            return { feedback };
        } catch (error) {
            throw new Error('피드백 정보 조회 실패: ' + error.message);
        }
    },

    // 학습 자료 조회
    async getMaterials(userId) {
        try {
            const query = `
                SELECT m.*, u.name as ownerName
                FROM study_materials m
                         JOIN users u ON m.userId = u.id
                WHERE m.userId = ? OR m.isShared = true
                ORDER BY m.createdAt DESC
            `;
            const materials = await dbUtils.query(query, [userId]);

            return { materials };
        } catch (error) {
            throw new Error('학습 자료 조회 실패: ' + error.message);
        }
    },

    // 학습 자료 업로드
    async uploadMaterial(userId, file, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                if (!file) {
                    throw new Error('파일이 필요합니다');
                }

                const fileUrl = await uploadFile(file);

                const query = `
                    INSERT INTO study_materials
                        (userId, title, type, url, size, isShared)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                const [result] = await connection.query(query, [
                    userId,
                    data.title,
                    file.mimetype,
                    fileUrl,
                    file.size,
                    false
                ]);

                return { materialId: result.insertId };
            } catch (error) {
                throw new Error('학습 자료 업로드 실패: ' + error.message);
            }
        });
    },

    // 학습 자료 삭제
    async deleteMaterial(materialId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [material] = await connection.query(
                    'SELECT * FROM study_materials WHERE id = ? AND userId = ?',
                    [materialId, userId]
                );

                if (!material) {
                    throw new Error('자료를 찾을 수 없습니다');
                }

                await deleteFile(material.url);

                await connection.query(
                    'DELETE FROM study_materials WHERE id = ?',
                    [materialId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('학습 자료 삭제 실패: ' + error.message);
            }
        });
    },

    // 학습 자료 공유
    async shareMaterial(materialId, userId) {
        try {
            const query = `
                UPDATE study_materials
                SET isShared = NOT isShared
                WHERE id = ? AND userId = ?
            `;
            const result = await dbUtils.query(query, [materialId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('자료를 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('학습 자료 공유 설정 실패: ' + error.message);
        }
    },

    // 학습 자료 버전 업데이트
    async updateVersion(materialId, userId, file) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [material] = await connection.query(
                    'SELECT * FROM study_materials WHERE id = ? AND userId = ?',
                    [materialId, userId]
                );

                if (!material) {
                    throw new Error('자료를 찾을 수 없습니다');
                }

                const fileUrl = await uploadFile(file);
                await deleteFile(material.url);

                await connection.query(`
                    UPDATE study_materials
                    SET url = ?,
                        version = version + 1,
                        size = ?,
                        updatedAt = NOW()
                    WHERE id = ?
                `, [fileUrl, file.size, materialId]);

                return { success: true };
            } catch (error) {
                throw new Error('학습 자료 버전 업데이트 실패: ' + error.message);
            }
        });
    },

    // 세션 통계 조회
    async getSessionStats(userId) {
        try {
            const query = `
                SELECT
                    COUNT(*) as totalSessions,
                    SUM(totalTime) as totalStudyTime,
                    AVG(cycles) as averageCycles,
                    MAX(totalTime) as longestSession,
                    COUNT(DISTINCT DATE(startTime)) as totalDays
                FROM study_sessions
                WHERE userId = ?
                  AND endTime IS NOT NULL
            `;
            const [stats] = await dbUtils.query(query, [userId]);

            // 최근 세션 기록
            const recentSessions = await dbUtils.query(`
                SELECT *
                FROM study_sessions
                WHERE userId = ?
                ORDER BY startTime DESC
                    LIMIT 5
            `, [userId]);

            return { stats, recentSessions };
        } catch (error) {
            throw new Error('세션 통계 조회 실패: ' + error.message);
        }
    },

    // 세션 종료
    async endSession(userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const { cycles, notes, totalTime, focusMode, endTime } = data;

                // 진행 중인 세션 확인
                const [activeSession] = await connection.query(`
                    SELECT id FROM study_sessions
                    WHERE userId = ? AND endTime IS NULL
                `, [userId]);

                if (!activeSession) {
                    throw new Error('진행 중인 세션이 없습니다');
                }

                // 세션 종료 처리
                await connection.query(`
                    UPDATE study_sessions
                    SET endTime = ?,
                        totalTime = ?,
                        cycles = ?,
                        notes = ?,
                        focusMode = ?
                    WHERE id = ?
                `, [
                    endTime,
                    totalTime,
                    cycles,
                    notes,
                    JSON.stringify(focusMode),
                    activeSession.id
                ]);

                return {
                    success: true,
                    sessionId: activeSession.id
                };
            } catch (error) {
                throw new Error('세션 종료 실패: ' + error.message);
            }
        });
    },

    // 사이클 업데이트
    async updateCycles(userId, data) {
        try {
            const { cycles, timestamp } = data;

            const query = `
                UPDATE study_sessions
                SET cycles = ?,
                    updatedAt = ?
                WHERE userId = ?
                  AND endTime IS NULL
            `;
            const result = await dbUtils.query(query, [
                cycles,
                timestamp,
                userId
            ]);

            if (result.affectedRows === 0) {
                throw new Error('진행 중인 세션이 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('사이클 업데이트 실패: ' + error.message);
        }
    },

    // 노트 저장
    async saveNotes(userId, data) {
        try {
            const { notes, sessionId } = data;

            const query = `
                UPDATE study_sessions
                SET notes = ?,
                    updatedAt = NOW()
                WHERE id = ? AND userId = ?
            `;
            const result = await dbUtils.query(query, [
                notes,
                sessionId,
                userId
            ]);

            if (result.affectedRows === 0) {
                throw new Error('세션을 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('노트 저장 실패: ' + error.message);
        }
    }
};

module.exports = studyService;
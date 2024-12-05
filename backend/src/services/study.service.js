const { dbUtils } = require('../config/database.config');

const studyService = {
    // 대시보드 데이터 조회
    async getDashboardData(userId) {
        try {
            const query = `
                SELECT 
                    COUNT(DISTINCT ss.id) as totalSessions,
                    SUM(ss.totalTime) as totalStudyTime,
                    AVG(se.understanding) as avgUnderstanding,
                    AVG(se.efficiency) as avgEfficiency
                FROM study_sessions ss
                LEFT JOIN self_evaluations se ON ss.id = se.sessionId
                WHERE ss.memberId = ? AND ss.status = 'completed'
            `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('대시보드 데이터 조회 실패: ' + error.message);
        }
    },

    // 학습 세션 시작
    async startStudySession(userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO study_sessions (
                        memberId, startTime, status, createdAt
                    ) VALUES (?, NOW(), 'active', NOW())
                `, [userId]);

                return { id: result.insertId, startTime: new Date() };
            } catch (error) {
                throw new Error('학습 세션 시작 실패: ' + error.message);
            }
        });
    },

    // 학습 세션 종료
    async endStudySession(sessionId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [session] = await connection.query(
                    'SELECT * FROM study_sessions WHERE id = ? AND memberId = ?',
                    [sessionId, userId]
                );

                if (!session) {
                    throw new Error('세션을 찾을 수 없습니다.');
                }

                const endTime = new Date();
                const totalTime = Math.floor((endTime - new Date(session.startTime)) / 60000);

                await connection.query(`
                    UPDATE study_sessions 
                    SET endTime = ?,
                        totalTime = ?,
                        status = 'completed',
                        updatedAt = NOW()
                    WHERE id = ?
                `, [endTime, totalTime, sessionId]);

                return {
                    id: sessionId,
                    totalTime,
                    endTime
                };
            } catch (error) {
                throw new Error('학습 세션 종료 실패: ' + error.message);
            }
        });
    },

    // 세션 통계 조회
    async getSessionStats(userId) {
        try {
            const query = `
                SELECT 
                    DATE(startTime) as date,
                    COUNT(*) as sessionCount,
                    SUM(totalTime) as totalTime,
                    AVG(cycles) as avgCycles
                FROM study_sessions
                WHERE memberId = ? 
                AND status = 'completed'
                GROUP BY DATE(startTime)
                ORDER BY date DESC
                LIMIT 30
            `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('세션 통계 조회 실패: ' + error.message);
        }
    },

    // 학습 자료 업로드
    async uploadMaterial(userId, file, materialData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO study_materials (
                        memberId, title, type, url, size, 
                        mimeType, version, createdAt
                    ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
                `, [
                    userId,
                    materialData.title,
                    materialData.type,
                    file.path,
                    file.size,
                    file.mimetype
                ]);

                return { id: result.insertId, ...materialData };
            } catch (error) {
                throw new Error('학습 자료 업로드 실패: ' + error.message);
            }
        });
    },

    // 학습 자료 공유
    async shareMaterial(userId, materialId, shareData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [material] = await connection.query(
                    'SELECT * FROM study_materials WHERE id = ? AND memberId = ?',
                    [materialId, userId]
                );

                if (!material) {
                    throw new Error('자료를 찾을 수 없거나 권한이 없습니다.');
                }

                await connection.query(`
                    UPDATE study_materials
                    SET isShared = true,
                        updatedAt = NOW()
                    WHERE id = ?
                `, [materialId]);

                const shareValues = shareData.recipients.map(recipientId => [
                    materialId,
                    recipientId,
                    shareData.permission || 'view'
                ]);

                await connection.query(`
                    INSERT INTO material_shares (
                        materialId, recipientId, permission, createdAt
                    ) VALUES ?
                `, [shareValues]);

                return { success: true };
            } catch (error) {
                throw new Error('자료 공유 실패: ' + error.message);
            }
        });
    },

    // 세션 종료 처리
    async endSession(userId, sessionData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const query = `
                UPDATE study_sessions
                SET endTime = ?,
                    totalTime = ?,
                    cycles = ?,
                    notes = ?,
                    focusMode = ?,
                    status = 'completed',
                    updatedAt = NOW()
                WHERE memberId = ? AND status = 'active'
            `;

                await connection.query(query, [
                    sessionData.endTime,
                    sessionData.totalTime,
                    sessionData.cycles,
                    sessionData.notes,
                    JSON.stringify(sessionData.focusMode),
                    userId
                ]);

                return { success: true, ...sessionData };
            } catch (error) {
                throw new Error('세션 종료 처리 실패: ' + error.message);
            }
        });
    },

// 사이클 업데이트
    async updateCycles(userId, cycles, timestamp) {
        try {
            const query = `
            UPDATE study_sessions
            SET cycles = ?,
                updatedAt = ?
            WHERE memberId = ? AND status = 'active'
        `;

            await dbUtils.query(query, [cycles, timestamp, userId]);
            return { cycles, timestamp };
        } catch (error) {
            throw new Error('사이클 업데이트 실패: ' + error.message);
        }
    },

// 노트 저장
    async saveNotes(userId, sessionId, notes) {
        try {
            const query = `
            UPDATE study_sessions
            SET notes = ?,
                updatedAt = NOW()
            WHERE id = ? AND memberId = ?
        `;

            await dbUtils.query(query, [notes, sessionId, userId]);
            return { sessionId, notes };
        } catch (error) {
            throw new Error('노트 저장 실패: ' + error.message);
        }
    },

// 통계 조회
    async getStatistics(userId) {
        try {
            const query = `
            SELECT 
                COUNT(*) as totalSessions,
                SUM(totalTime) as totalStudyTime,
                AVG(cycles) as avgCycles,
                MAX(totalTime) as longestSession,
                COUNT(DISTINCT DATE(startTime)) as totalDays
            FROM study_sessions
            WHERE memberId = ? AND status = 'completed'
        `;

            const [stats] = await dbUtils.query(query, [userId]);
            return stats;
        } catch (error) {
            throw new Error('통계 조회 실패: ' + error.message);
        }
    },

// 추천 정보 조회
    async getRecommendations(userId) {
        try {
            const query = `
            SELECT 
                HOUR(startTime) as preferredHour,
                AVG(totalTime) as avgDuration,
                COUNT(*) as sessionCount
            FROM study_sessions
            WHERE memberId = ? AND status = 'completed'
            GROUP BY HOUR(startTime)
            ORDER BY sessionCount DESC
            LIMIT 5
        `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('추천 정보 조회 실패: ' + error.message);
        }
    },

// 분석 데이터 조회
    async getAnalytics(userId, timeRange) {
        try {
            const query = `
            SELECT 
                DATE(startTime) as date,
                COUNT(*) as sessions,
                SUM(totalTime) as totalTime,
                AVG(cycles) as avgCycles
            FROM study_sessions
            WHERE memberId = ? 
            AND startTime >= DATE_SUB(NOW(), INTERVAL ? DAY)
            AND status = 'completed'
            GROUP BY DATE(startTime)
            ORDER BY date DESC
        `;

            return await dbUtils.query(query, [userId, timeRange]);
        } catch (error) {
            throw new Error('분석 데이터 조회 실패: ' + error.message);
        }
    },

// 과목별 분석 데이터 조회
    async getSubjectAnalytics(userId, subjectId, timeRange) {
        try {
            const query = `
            SELECT 
                s.name as subjectName,
                COUNT(ss.id) as totalSessions,
                SUM(ss.totalTime) as totalTime,
                AVG(se.understanding) as avgUnderstanding
            FROM study_sessions ss
            JOIN subjects s ON ss.subjectId = s.id
            LEFT JOIN self_evaluations se ON ss.id = se.sessionId
            WHERE ss.memberId = ? 
            AND ss.subjectId = ?
            AND ss.startTime >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY s.id
        `;

            return await dbUtils.query(query, [userId, subjectId, timeRange]);
        } catch (error) {
            throw new Error('과목별 분석 데이터 조회 실패: ' + error.message);
        }
    },

// 일정 목록 조회
    async getSchedules(userId) {
        try {
            const query = `
            SELECT *
            FROM study_schedules
            WHERE memberId = ?
            AND startTime >= NOW()
            ORDER BY startTime ASC
        `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('일정 목록 조회 실패: ' + error.message);
        }
    },

// 일정 생성
    async createSchedule(userId, scheduleData) {
        try {
            const query = `
            INSERT INTO study_schedules (
                memberId, title, startTime, endTime,
                repeat, repeatPattern, notification,
                createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

            const [result] = await dbUtils.query(query, [
                userId,
                scheduleData.title,
                scheduleData.startTime,
                scheduleData.endTime,
                scheduleData.repeat || false,
                JSON.stringify(scheduleData.repeatPattern),
                scheduleData.notification
            ]);

            return { id: result.insertId, ...scheduleData };
        } catch (error) {
            throw new Error('일정 생성 실패: ' + error.message);
        }
    },

// 일정 수정
    async updateSchedule(userId, scheduleId, updateData) {
        try {
            const query = `
            UPDATE study_schedules
            SET title = ?,
                startTime = ?,
                endTime = ?,
                repeat = ?,
                repeatPattern = ?,
                notification = ?,
                updatedAt = NOW()
            WHERE id = ? AND memberId = ?
        `;

            await dbUtils.query(query, [
                updateData.title,
                updateData.startTime,
                updateData.endTime,
                updateData.repeat,
                JSON.stringify(updateData.repeatPattern),
                updateData.notification,
                scheduleId,
                userId
            ]);

            return { id: scheduleId, ...updateData };
        } catch (error) {
            throw new Error('일정 수정 실패: ' + error.message);
        }
    },

// 일정 삭제
    async deleteSchedule(userId, scheduleId) {
        try {
            const query = `
            DELETE FROM study_schedules
            WHERE id = ? AND memberId = ?
        `;

            await dbUtils.query(query, [scheduleId, userId]);
            return { success: true };
        } catch (error) {
            throw new Error('일정 삭제 실패: ' + error.message);
        }
    },

// 학습 일지 저장
    async saveJournal(userId, journalData) {
        try {
            const query = `
            INSERT INTO study_journals (
                memberId, title, content, achievements,
                difficulties, improvements, nextGoals,
                mood, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

            const [result] = await dbUtils.query(query, [
                userId,
                journalData.title,
                journalData.content,
                journalData.achievements,
                journalData.difficulties,
                journalData.improvements,
                journalData.nextGoals,
                journalData.mood
            ]);

            return { id: result.insertId, ...journalData };
        } catch (error) {
            throw new Error('학습 일지 저장 실패: ' + error.message);
        }
    },

// 피드백 조회
    async getFeedback(userId) {
        try {
            const query = `
            SELECT se.*, ss.startTime, ss.totalTime
            FROM self_evaluations se
            JOIN study_sessions ss ON se.sessionId = ss.id
            WHERE ss.memberId = ?
            ORDER BY ss.startTime DESC
            LIMIT 10
        `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('피드백 조회 실패: ' + error.message);
        }
    },

// 자기 평가 저장
    async saveSelfEvaluation(userId, evaluationData) {
        try {
            const query = `
            INSERT INTO self_evaluations (
                sessionId, understanding, effort,
                efficiency, notes, createdAt
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `;

            const [result] = await dbUtils.query(query, [
                evaluationData.sessionId,
                evaluationData.understanding,
                evaluationData.effort,
                evaluationData.efficiency,
                evaluationData.notes
            ]);

            return { id: result.insertId, ...evaluationData };
        } catch (error) {
            throw new Error('자기 평가 저장 실패: ' + error.message);
        }
    },

// 학습 자료 목록 조회
    async getMaterials(userId) {
        try {
            const query = `
            SELECT *
            FROM study_materials
            WHERE memberId = ?
            ORDER BY createdAt DESC
        `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('학습 자료 목록 조회 실패: ' + error.message);
        }
    },

// 학습 자료 삭제
    async deleteMaterial(userId, materialId) {
        try {
            const query = `
            DELETE FROM study_materials
            WHERE id = ? AND memberId = ?
        `;

            await dbUtils.query(query, [materialId, userId]);
            return { success: true };
        } catch (error) {
            throw new Error('학습 자료 삭제 실패: ' + error.message);
        }
    },

// 학습 자료 버전 업데이트
    async updateMaterialVersion(userId, materialId, versionData) {
        try {
            const query = `
            UPDATE study_materials
            SET version = version + 1,
                url = ?,
                size = ?,
                mimeType = ?,
                updatedAt = NOW()
            WHERE id = ? AND memberId = ?
        `;

            await dbUtils.query(query, [
                versionData.url,
                versionData.size,
                versionData.mimeType,
                materialId,
                userId
            ]);

            return { id: materialId, ...versionData };
        } catch (error) {
            throw new Error('학습 자료 버전 업데이트 실패: ' + error.message);
        }
    }
};

module.exports = studyService;
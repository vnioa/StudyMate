const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// 대시보드 데이터 조회
const getDashboard = async (req, res) => {
    try {
        const [todayStats] = await db.execute(
            'SELECT SUM(duration) as total_time FROM study_sessions WHERE user_id = ? AND DATE(created_at) = CURDATE()',
            [req.user.user_id]
        );

        const [streak] = await db.execute(
            'SELECT COUNT(*) as days FROM (SELECT DISTINCT DATE(created_at) FROM study_sessions WHERE user_id = ? ORDER BY created_at DESC) as dates',
            [req.user.user_id]
        );

        const [weeklyStats] = await db.execute(
            `SELECT DATE(created_at) as date, SUM(duration) as study_time 
             FROM study_sessions 
             WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)`,
            [req.user.user_id]
        );

        res.status(200).json({
            success: true,
            todayStats: todayStats[0] || { total_time: 0 },
            streak: streak[0]?.days || 0,
            weeklyData: weeklyStats || []
        });

    } catch (error) {
        console.error('대시보드 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '대시보드 데이터를 불러오는데 실패했습니다.'
        });
    }
};

// 학습 세션 시작
const startSession = async (req, res) => {
    try {
        const [result] = await db.execute(
            'INSERT INTO study_sessions (user_id, status) VALUES (?, \'active\')',
            [req.users.user_id]
        );

        res.status(200).json({
            success: true,
            sessionId: result.insertId
        });
    } catch (error) {
        console.error('학습 세션 시작 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 세션을 시작할 수 없습니다.'
        });
    }
};

// 학습 세션 종료
const endSession = async (req, res) => {
    const { cycles, notes, totalTime, focusMode, endTime } = req.body;
    try {
        await db.execute(
            `UPDATE study_sessions 
             SET status = \'completed\', cycles = ?, notes = ?, duration = ?, 
                 focus_mode = ?, end_time = ?
             WHERE user_id = ? AND status = \'active\'`,
            [cycles, notes, totalTime, JSON.stringify(focusMode), endTime, req.user.id]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 세션 종료 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 세션 종료에 실패했습니다.'
        });
    }
};

// 학습 분석 데이터 조회
const getAnalytics = async (req, res) => {
    const { timeRange } = req.params;
    try {
        const [subjects] = await db.execute(
            `SELECT subject, SUM(duration) as total_time 
             FROM study_sessions 
             WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 ${timeRange})
             GROUP BY subject`,
            [req.users.user_id]
        );

        const [weeklyHours] = await db.execute(
            `SELECT DATE(created_at) as date, SUM(duration) as hours
             FROM study_sessions
             WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 ${timeRange})
             GROUP BY DATE(created_at)`,
            [req.users.user_id]
        );

        res.status(200).json({
            subjects,
            weeklyHours: {
                labels: weeklyHours.map(w => w.date),
                datasets: [{
                    data: weeklyHours.map(w => w.hours)
                }]
            }
        });
    } catch (error) {
        console.error('학습 분석 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 분석 데이터를 불러오는데 실패했습니다.'
        });
    }
};

// 학습 자료 관리
const getMaterials = async (req, res) => {
    try {
        const [materials] = await db.execute(
            'SELECT * FROM materials WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json({ materials });
    } catch (error) {
        console.error('학습 자료 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료를 불러오는데 실패했습니다.'
        });
    }
};

const uploadMaterial = async (req, res) => {
    const { storage_type } = req.body;
    try {
        let fileUrl = '';
        fileUrl = req.body.fileUrl;
        const [result] = await db.execute(
            'INSERT INTO materials (user_id, title, file_url) VALUES (?, ?, ?)',
            [req.user.id, req.body.title, fileUrl, storage_type]
        );

        res.status(200).json({
            success: true,
            material: {
                id: result.insertId,
                title: req.body.title,
                fileUrl
            }
        });
    } catch (error) {
        console.error('학습 자료 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료 업로드에 실패했습니다.'
        });
    }
};

// 과목별 분석 데이터 조회
const getSubjectAnalytics = async (req, res) => {
    const { subjectId, timeRange } = req.params;
    try {
        const [analytics] = await db.execute(
            `SELECT * FROM subject_analytics 
             WHERE subject_id = ? AND user_id = ? 
             AND created_at >= DATE_SUB(NOW(), INTERVAL 1 ${timeRange})`,
            [subjectId, req.user.id]
        );
        res.status(200).json({ analytics });
    } catch (error) {
        console.error('과목별 분석 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '과목별 분석 데이터를 불러오는데 실패했습니다.'
        });
    }
};

// 학습 일정 조회
const getSchedules = async (req, res) => {
    const { date } = req.query;
    try {
        const [schedules] = await db.execute(
            'SELECT * FROM study_schedules WHERE user_id = ? AND date = ?',
            [req.user.id, date]
        );
        res.status(200).json({ schedules });
    } catch (error) {
        console.error('학습 일정 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 일정을 불러오는데 실패했습니다.'
        });
    }
};

// 학습 일정 생성
const createSchedule = async (req, res) => {
    const { title, startTime, endTime, repeat, notification, shared } = req.body;
    try {
        const [result] = await db.execute(
            `INSERT INTO study_schedules 
            (user_id, title, start_time, end_time, repeat, notification, shared) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, startTime, endTime, repeat, notification, shared]
        );
        res.status(200).json({
            success: true,
            schedule: { id: result.insertId, ...req.body }
        });
    } catch (error) {
        console.error('학습 일정 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 일정 생성에 실패했습니다.'
        });
    }
};

// 학습 일정 수정
const updateSchedule = async (req, res) => {
    const { scheduleId } = req.params;
    const { title, startTime, endTime, repeat, notification, shared } = req.body;
    try {
        await db.execute(
            `UPDATE study_schedules 
             SET title = ?, start_time = ?, end_time = ?, 
                 repeat = ?, notification = ?, shared = ?
             WHERE schedule_id = ? AND user_id = ?`,
            [title, startTime, endTime, repeat, notification, shared, scheduleId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 일정 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 일정 수정에 실패했습니다.'
        });
    }
};

// 학습 일정 삭제
const deleteSchedule = async (req, res) => {
    const { scheduleId } = req.params;
    try {
        await db.execute(
            'DELETE FROM study_schedules WHERE schedule_id = ? AND user_id = ?',
            [scheduleId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 일정 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 일정 삭제에 실패했습니다.'
        });
    }
};

// 피드백 정보 조회
const getFeedback = async (req, res) => {
    try {
        const [feedback] = await db.execute(
            `SELECT se.*, sj.* 
             FROM self_evaluations se 
             LEFT JOIN study_journals sj ON se.user_id = sj.user_id 
             WHERE se.user_id = ? 
             ORDER BY se.created_at DESC LIMIT 1`,
            [req.user.id]
        );
        res.status(200).json({
            selfEvaluation: feedback[0],
            studyJournal: feedback[0]
        });
    } catch (error) {
        console.error('피드백 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 자기 평가 저장
const saveSelfEvaluation = async (req, res) => {
    const { understanding, effort, efficiency, notes, date } = req.body;
    try {
        await db.execute(
            `INSERT INTO self_evaluations 
            (user_id, understanding, effort, efficiency, notes, evaluation_date) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, understanding, effort, efficiency, notes, date]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('자기 평가 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '자기 평가 저장에 실패했습니다.'
        });
    }
};

// 학습 자료 삭제
const deleteMaterial = async (req, res) => {
    const { materialId } = req.params;
    try {
        await db.execute(
            'DELETE FROM materials WHERE material_id = ? AND user_id = ?',
            [materialId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 자료 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료 삭제에 실패했습니다.'
        });
    }
};

// 학습 자료 공유
const shareMaterial = async (req, res) => {
    const { materialId } = req.params;
    try {
        await db.execute(
            'UPDATE materials SET is_shared = true WHERE material_id = ? AND user_id = ?',
            [materialId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 자료 공유 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료 공유에 실패했습니다.'
        });
    }
};

// 학습 자료 버전 업데이트
const updateMaterialVersion = async (req, res) => {
    const { materialId } = req.params;
    try {
        await db.execute(
            'UPDATE materials SET version = version + 1 WHERE material_id = ? AND user_id = ?',
            [materialId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('학습 자료 버전 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 자료 버전 업데이트에 실패했습니다.'
        });
    }
};

// 세션 통계 조회
const getSessionStats = async (req, res) => {
    try {
        const [stats] = await db.execute(
            `SELECT SUM(duration) as total_time, 
                    COUNT(*) as completed_cycles,
                    AVG(duration) as average_focus_time 
             FROM study_sessions 
             WHERE user_id = ? AND status = 'completed'`,
            [req.user.id]
        );
        res.status(200).json(stats[0]);
    } catch (error) {
        console.error('세션 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '세션 통계를 불러오는데 실패했습니다.'
        });
    }
};

// 학습 세션 종료
const endStudySession = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const [result] = await db.execute(
            'UPDATE study_sessions SET status = \'completed\', end_time = NOW() WHERE session_id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );
        res.status(200).json({
            success: true,
            duration: result.duration
        });
    } catch (error) {
        console.error('학습 세션 종료 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 세션 종료에 실패했습니다.'
        });
    }
};

// 세션 사이클 업데이트
const updateCycles = async (req, res) => {
    const { cycles, timestamp } = req.body;
    try {
        await db.execute(
            'UPDATE study_sessions SET cycles = ?, last_update = ? WHERE user_id = ? AND status = \'active\'',
            [cycles, timestamp, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('세션 사이클 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '세션 사이클 업데이트에 실패했습니다.'
        });
    }
};

// 세션 노트 저장
const saveNotes = async (req, res) => {
    const { notes, sessionId } = req.body;
    try {
        await db.execute(
            'UPDATE study_sessions SET notes = ? WHERE session_id = ? AND user_id = ?',
            [notes, sessionId, req.users.user_id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('세션 노트 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '세션 노트 저장에 실패했습니다.'
        });
    }
};

module.exports = {
    getDashboard,
    startSession,
    endSession,
    getAnalytics,
    getSubjectAnalytics,
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getFeedback,
    saveSelfEvaluation,
    getMaterials,
    uploadMaterial,
    deleteMaterial,
    shareMaterial,
    updateMaterialVersion,
    getSessionStats,
    endStudySession,
    updateCycles,
    saveNotes
};
const db = require('../config/db');

// 피드백 정보 조회
const getFeedback = async (req, res) => {
    try {
        const [selfEvaluation] = await db.execute(
            'SELECT * FROM self_evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );

        const [studyJournal] = await db.execute(
            'SELECT * FROM study_journals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );

        res.status(200).json({
            selfEvaluation: selfEvaluation[0] || null,
            studyJournal: studyJournal[0] || null
        });
    } catch (error) {
        console.error('피드백 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '피드백 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 자기 평가 이력 조회
const getSelfEvaluationHistory = async (req, res) => {
    try {
        const [selfEval] = await db.execute(
            'SELECT * FROM self_evaluations WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.status(200).json({ selfEval });
    } catch (error) {
        console.error('자기 평가 이력 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '자기 평가 이력을 불러오는데 실패했습니다.'
        });
    }
};

// 학습 일지 이력 조회
const getJournalHistory = async (req, res) => {
    try {
        const [journal] = await db.execute(
            'SELECT * FROM study_journals WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.status(200).json({ journal });
    } catch (error) {
        console.error('학습 일지 이력 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 일지 이력을 불러오는데 실패했습니다.'
        });
    }
};

// 자기 평가 저장
const saveSelfEvaluation = async (req, res) => {
    const { understanding, effort, efficiency, notes, date } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO self_evaluations 
            (user_id, understanding, effort, efficiency, notes, evaluation_date) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, understanding, effort, efficiency, notes, date]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true });
        } else {
            throw new Error('자기 평가 저장 실패');
        }
    } catch (error) {
        console.error('자기 평가 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '자기 평가 저장에 실패했습니다.'
        });
    }
};

// 학습 일지 저장
const saveJournal = async (req, res) => {
    const { date, content, achievements, difficulties, improvements, nextGoals } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO study_journals 
            (user_id, journal_date, content, achievements, difficulties, improvements, next_goals) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, date, content, achievements, difficulties, improvements, nextGoals]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true });
        } else {
            throw new Error('학습 일지 저장 실패');
        }
    } catch (error) {
        console.error('학습 일지 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '학습 일지 저장에 실패했습니다.'
        });
    }
};

module.exports = {
    getFeedback,
    getSelfEvaluationHistory,
    getJournalHistory,
    saveSelfEvaluation,
    saveJournal
};
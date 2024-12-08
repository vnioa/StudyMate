const db = require('../config/db');

// 질문 유효성 검사
const validateQuestion = async (req, res) => {
    const { title, content } = req.body;
    try {
        if (!title || title.length < 5) {
            return res.status(400).json({
                success: false,
                message: '제목은 5자 이상이어야 합니다.'
            });
        }
        if (!content || content.length < 10) {
            return res.status(400).json({
                success: false,
                message: '내용은 10자 이상이어야 합니다.'
            });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('질문 유효성 검사 오류:', error);
        res.status(500).json({
            success: false,
            message: '질문 유효성 검사에 실패했습니다.'
        });
    }
};

// 질문 생성
const createQuestion = async (req, res) => {
    const { title, content } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO questions (user_id, title, content) VALUES (?, ?, ?)',
            [req.user.id, title, content]
        );
        res.status(201).json({
            success: true,
            questionId: result.insertId
        });
    } catch (error) {
        console.error('질문 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '질문 생성에 실패했습니다.'
        });
    }
};

// 질문 목록 조회
const getQuestions = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    try {
        let query = 'SELECT q.*, u.username FROM questions q JOIN users u ON q.user_id = u.user_id';
        const params = [];

        if (search) {
            query += ' WHERE title LIKE ? OR content LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), (page - 1) * limit);

        const [questions] = await db.execute(query, params);
        const [total] = await db.execute('SELECT COUNT(*) as count FROM questions');

        res.status(200).json({
            questions,
            totalCount: total[0].count
        });
    } catch (error) {
        console.error('질문 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '질문 목록을 불러오는데 실패했습니다.'
        });
    }
};

// 질문 상세 조회
const getQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        const [question] = await db.execute(
            'SELECT q.*, u.username FROM questions q JOIN users u ON q.user_id = u.user_id WHERE q.question_id = ?',
            [questionId]
        );

        if (question.length === 0) {
            return res.status(404).json({
                success: false,
                message: '질문을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            question: question[0]
        });
    } catch (error) {
        console.error('질문 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '질문을 불러오는데 실패했습니다.'
        });
    }
};

// 질문 수정
const updateQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { title, content } = req.body;
    try {
        await db.execute(
            'UPDATE questions SET title = ?, content = ?, updated_at = NOW() WHERE question_id = ? AND user_id = ?',
            [title, content, questionId, req.user.id]
        );
        res.status(200).json({
            success: true,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('질문 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '질문 수정에 실패했습니다.'
        });
    }
};

// 질문 삭제
const deleteQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        await db.execute(
            'DELETE FROM questions WHERE question_id = ? AND user_id = ?',
            [questionId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('질문 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '질문 삭제에 실패했습니다.'
        });
    }
};

// 답변 작성
const createAnswer = async (req, res) => {
    const { questionId } = req.params;
    const { content } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)',
            [questionId, req.user.id, content]
        );
        res.status(201).json({
            answer: {
                answerId: result.insertId,
                content,
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('답변 작성 오류:', error);
        res.status(500).json({
            success: false,
            message: '답변 작성에 실패했습니다.'
        });
    }
};

// 답변 수정
const updateAnswer = async (req, res) => {
    const { answerId } = req.params;
    const { content } = req.body;
    try {
        await db.execute(
            'UPDATE answers SET content = ?, updated_at = NOW() WHERE answer_id = ? AND user_id = ?',
            [content, answerId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('답변 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '답변 수정에 실패했습니다.'
        });
    }
};

// 답변 삭제
const deleteAnswer = async (req, res) => {
    const { answerId } = req.params;
    try {
        await db.execute(
            'DELETE FROM answers WHERE answer_id = ? AND user_id = ?',
            [answerId, req.user.id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('답변 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '답변 삭제에 실패했습니다.'
        });
    }
};

// 커뮤니티 데이터 조회
const getData = async (req, res) => {
    const { tab } = req.params;
    try {
        let items = [];
        switch (tab) {
            case 'groups':
                [items] = await db.execute('SELECT * FROM study_groups ORDER BY created_at DESC');
                break;
            case 'qna':
                [items] = await db.execute('SELECT * FROM questions ORDER BY created_at DESC');
                break;
            case 'mentoring':
                [items] = await db.execute('SELECT * FROM mentors ORDER BY created_at DESC');
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 탭입니다.'
                });
        }
        res.status(200).json({ items });
    } catch (error) {
        console.error('커뮤니티 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '데이터를 불러오는데 실패했습니다.'
        });
    }
};

module.exports = {
    validateQuestion,
    createQuestion,
    getQuestions,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    createAnswer,
    deleteAnswer,
    updateAnswer,
    getData
};
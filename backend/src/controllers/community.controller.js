const db = require('../config/mysql');
const createError = require('http-errors');

const CommunityController = {
    // 질문 유효성 검사
    validateQuestion: async (req, res, next) => {
        try {
            const { title, content } = req.body;
            if (!title || title.length < 5 || title.length > 100) {
                throw createError(400, '제목은 5자 이상 100자 이하여야 합니다.');
            }
            if (!content || content.length < 10) {
                throw createError(400, '내용은 10자 이상이어야 합니다.');
            }
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    },

    // 질문 생성
    createQuestion: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { title, content } = req.body;
            const [result] = await connection.query(
                'INSERT INTO questions (user_id, title, content) VALUES (?, ?, ?)',
                [req.user.id, title, content]
            );
            res.json({ success: true, questionId: result.insertId });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 질문 목록 조회
    getQuestions: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { page = 1, limit = 20, search } = req.query;
            const offset = (page - 1) * limit;
            let query = `
        SELECT q.*, u.name as author_name, 
               (SELECT COUNT(*) FROM answers WHERE question_id = q.id) as answer_count
        FROM questions q
        JOIN users u ON q.user_id = u.id
      `;
            const params = [];
            if (search) {
                query += ' WHERE q.title LIKE ? OR q.content LIKE ?';
                params.push(`%${search}%`, `%${search}%`);
            }
            query += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [questions] = await connection.query(query, params);
            const [totalCount] = await connection.query('SELECT COUNT(*) as count FROM questions');

            res.json({ questions, totalCount: totalCount[0].count });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 질문 상세 조회
    getQuestion: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { questionId } = req.params;
            const [question] = await connection.query(
                `SELECT q.*, u.name as author_name
         FROM questions q
         JOIN users u ON q.user_id = u.id
         WHERE q.id = ?`,
                [questionId]
            );
            if (!question.length) {
                throw createError(404, '질문을 찾을 수 없습니다.');
            }
            res.json({ question: question[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 질문 수정
    updateQuestion: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { questionId } = req.params;
            const { title, content } = req.body;
            const [result] = await connection.query(
                'UPDATE questions SET title = ?, content = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
                [title, content, questionId, req.user.id]
            );
            if (result.affectedRows === 0) {
                throw createError(403, '질문을 수정할 권한이 없습니다.');
            }
            res.json({ success: true, updatedAt: new Date() });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 질문 삭제
    deleteQuestion: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { questionId } = req.params;
            const [result] = await connection.query(
                'DELETE FROM questions WHERE id = ? AND user_id = ?',
                [questionId, req.user.id]
            );
            if (result.affectedRows === 0) {
                throw createError(403, '질문을 삭제할 권한이 없습니다.');
            }
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 답변 작성
    createAnswer: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { questionId } = req.params;
            const { content } = req.body;
            const [result] = await connection.query(
                'INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)',
                [questionId, req.user.id, content]
            );
            const [answer] = await connection.query(
                'SELECT * FROM answers WHERE id = ?',
                [result.insertId]
            );
            res.json({ answer: answer[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 답변 삭제
    deleteAnswer: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { answerId } = req.params;
            const [result] = await connection.query(
                'DELETE FROM answers WHERE id = ? AND user_id = ?',
                [answerId, req.user.id]
            );
            if (result.affectedRows === 0) {
                throw createError(403, '답변을 삭제할 권한이 없습니다.');
            }
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 답변 수정
    updateAnswer: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { answerId } = req.params;
            const { content } = req.body;
            const [result] = await connection.query(
                'UPDATE answers SET content = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
                [content, answerId, req.user.id]
            );
            if (result.affectedRows === 0) {
                throw createError(403, '답변을 수정할 권한이 없습니다.');
            }
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 커뮤니티 데이터 조회
    getData: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { tab } = req.params;
            let query;
            switch (tab) {
                case 'groups':
                    query = 'SELECT * FROM study_groups ORDER BY created_at DESC LIMIT 20';
                    break;
                case 'qna':
                    query = 'SELECT * FROM questions ORDER BY created_at DESC LIMIT 20';
                    break;
                case 'mentoring':
                    query = 'SELECT * FROM mentors ORDER BY created_at DESC LIMIT 20';
                    break;
                default:
                    throw createError(400, '유효하지 않은 탭입니다.');
            }
            const [items] = await connection.query(query);
            res.json({ items });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 스터디 그룹 생성
    createStudyGroup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { name, category, description } = req.body;
            const [result] = await connection.query(
                'INSERT INTO study_groups (name, category, description, created_by) VALUES (?, ?, ?, ?)',
                [name, category, description, req.user.id]
            );
            res.json({ groupId: result.insertId });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 스터디 그룹 상세 조회
    getStudyGroup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            const [group] = await connection.query(
                'SELECT * FROM study_groups WHERE id = ?',
                [groupId]
            );
            if (!group.length) {
                throw createError(404, '스터디 그룹을 찾을 수 없습니다.');
            }
            res.json({ group: group[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 질문 상세 조회 (답변 포함)
    getQuestionDetail: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { questionId } = req.params;
            const [question] = await connection.query(
                `SELECT q.*, u.name as author_name
         FROM questions q
         JOIN users u ON q.user_id = u.id
         WHERE q.id = ?`,
                [questionId]
            );
            if (!question.length) {
                throw createError(404, '질문을 찾을 수 없습니다.');
            }
            const [answers] = await connection.query(
                `SELECT a.*, u.name as author_name
         FROM answers a
         JOIN users u ON a.user_id = u.id
         WHERE a.question_id = ?
         ORDER BY a.created_at ASC`,
                [questionId]
            );
            res.json({ question: question[0], answers });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 멘토 등록
    registerMentor: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { field, experience, introduction } = req.body;
            const [result] = await connection.query(
                'INSERT INTO mentors (user_id, field, experience, introduction) VALUES (?, ?, ?, ?)',
                [req.user.id, field, experience, introduction]
            );
            res.json({ mentorId: result.insertId });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 멘토 상세 조회
    getMentorDetail: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { mentorId } = req.params;
            const [mentor] = await connection.query(
                `SELECT m.*, u.name, u.email
         FROM mentors m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
                [mentorId]
            );
            if (!mentor.length) {
                throw createError(404, '멘토를 찾을 수 없습니다.');
            }
            res.json({ mentor: mentor[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 멘토링 채팅 시작
    startMentorChat: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { mentorId } = req.params;
            const [mentor] = await connection.query(
                'SELECT user_id FROM mentors WHERE id = ?',
                [mentorId]
            );
            if (!mentor.length) {
                throw createError(404, '멘토를 찾을 수 없습니다.');
            }
            const [result] = await connection.query(
                'INSERT INTO chat_rooms (type, created_by) VALUES ("mentoring", ?)',
                [req.user.id]
            );
            await connection.query(
                'INSERT INTO room_participants (room_id, user_id) VALUES (?, ?), (?, ?)',
                [result.insertId, req.user.id, result.insertId, mentor[0].user_id]
            );
            res.json({ chatId: result.insertId });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = CommunityController;
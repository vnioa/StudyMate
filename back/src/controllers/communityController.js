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

const communityController = {
    // 질문 유효성 검사
    validateQuestion: async (req, res) => {
        try {
            const { title, content } = req.body;

            // 제목 길이 검사
            if (title.length < 5 || title.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: '제목은 5자 이상 100자 이하여야 합니다.'
                });
            }

            // 내용 길이 검사
            if (content.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: '내용은 10자 이상이어야 합니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '유효한 질문입니다.'
            });
        } catch (error) {
            console.error('질문 유효성 검사 오류:', error);
            res.status(500).json({
                success: false,
                message: '질문 유효성 검사에 실패했습니다.'
            });
        }
    },

    // 질문 생성
    createQuestion: async (req, res) => {
        try {
            const { title, content, tags } = req.body;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [question] = await connection.execute(
                    'INSERT INTO questions (title, content, authorId) VALUES (?, ?, ?)',
                    [title, content, userId]
                );

                if (tags && tags.length > 0) {
                    const tagValues = tags.map(tag => [question.insertId, tag]);
                    await connection.execute(
                        'INSERT INTO question_tags (questionId, tag) VALUES ?',
                        [tagValues]
                    );
                }

                return { id: question.insertId };
            });

            res.status(201).json({
                success: true,
                message: '질문이 생성되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('질문 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '질문 생성에 실패했습니다.'
            });
        }
    },

    // 질문 목록 조회
    getQuestions: async (req, res) => {
        try {
            const { page = 1, limit = 10, sort = 'latest' } = req.query;
            const offset = (page - 1) * limit;

            let orderBy = 'q.createdAt DESC';
            if (sort === 'popular') {
                orderBy = 'q.viewCount DESC, q.createdAt DESC';
            }

            const query = `
        SELECT q.*, u.username as authorName,
               COUNT(DISTINCT a.id) as answerCount,
               GROUP_CONCAT(DISTINCT qt.tag) as tags
        FROM questions q
        JOIN users u ON q.authorId = u.id
        LEFT JOIN answers a ON q.id = a.questionId
        LEFT JOIN question_tags qt ON q.id = qt.questionId
        WHERE q.deletedAt IS NULL
        GROUP BY q.id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;

            const questions = await utils.executeQuery(query, [Number(limit), offset]);

            const [{ total }] = await utils.executeQuery(
                'SELECT COUNT(*) as total FROM questions WHERE deletedAt IS NULL'
            );

            res.status(200).json({
                success: true,
                data: {
                    questions,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('질문 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '질문 목록 조회에 실패했습니다.'
            });
        }
    },

    // 질문 상세 조회
    getQuestion: async (req, res) => {
        try {
            const { questionId } = req.params;
            const userId = req.user.id;

            const [question] = await utils.executeQuery(`
        SELECT q.*, u.username as authorName,
               GROUP_CONCAT(DISTINCT qt.tag) as tags,
               EXISTS(SELECT 1 FROM bookmarks b 
                     WHERE b.questionId = q.id AND b.userId = ?) as isBookmarked
        FROM questions q
        JOIN users u ON q.authorId = u.id
        LEFT JOIN question_tags qt ON q.id = qt.questionId
        WHERE q.id = ? AND q.deletedAt IS NULL
        GROUP BY q.id
      `, [userId, questionId]);

            if (!question) {
                return res.status(404).json({
                    success: false,
                    message: '질문을 찾을 수 없습니다.'
                });
            }

            // 조회수 증가
            await utils.executeQuery(
                'UPDATE questions SET viewCount = viewCount + 1 WHERE id = ?',
                [questionId]
            );

            // 답변 목록 조회
            const answers = await utils.executeQuery(`
        SELECT a.*, u.username as authorName,
               COUNT(al.id) as likeCount,
               EXISTS(SELECT 1 FROM answer_likes al2 
                     WHERE al2.answerId = a.id AND al2.userId = ?) as isLiked
        FROM answers a
        JOIN users u ON a.authorId = u.id
        LEFT JOIN answer_likes al ON a.id = al.answerId
        WHERE a.questionId = ? AND a.deletedAt IS NULL
        GROUP BY a.id
        ORDER BY a.isAccepted DESC, likeCount DESC, a.createdAt ASC
      `, [userId, questionId]);

            res.status(200).json({
                success: true,
                data: { question, answers }
            });
        } catch (error) {
            console.error('질문 상세 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '질문 상세 조회에 실패했습니다.'
            });
        }
    },

    // 질문 수정
    updateQuestion: async (req, res) => {
        try {
            const { questionId } = req.params;
            const { title, content, tags } = req.body;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const [question] = await connection.execute(
                    'SELECT authorId FROM questions WHERE id = ? AND deletedAt IS NULL',
                    [questionId]
                );

                if (!question || question.authorId !== userId) {
                    throw new Error('수정 권한이 없습니다.');
                }

                await connection.execute(
                    'UPDATE questions SET title = ?, content = ? WHERE id = ?',
                    [title, content, questionId]
                );

                if (tags) {
                    await connection.execute(
                        'DELETE FROM question_tags WHERE questionId = ?',
                        [questionId]
                    );

                    if (tags.length > 0) {
                        const tagValues = tags.map(tag => [questionId, tag]);
                        await connection.execute(
                            'INSERT INTO question_tags (questionId, tag) VALUES ?',
                            [tagValues]
                        );
                    }
                }
            });

            res.status(200).json({
                success: true,
                message: '질문이 수정되었습니다.'
            });
        } catch (error) {
            console.error('질문 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '질문 수정에 실패했습니다.'
            });
        }
    },

    // 질문 삭제
    deleteQuestion: async (req, res) => {
        try {
            const { questionId } = req.params;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const [question] = await connection.execute(
                    'SELECT authorId FROM questions WHERE id = ? AND deletedAt IS NULL',
                    [questionId]
                );

                if (!question || question.authorId !== userId) {
                    throw new Error('삭제 권한이 없습니다.');
                }

                await connection.execute(
                    'UPDATE questions SET deletedAt = NOW() WHERE id = ?',
                    [questionId]
                );
            });

            res.status(200).json({
                success: true,
                message: '질문이 삭제되었습니다.'
            });
        } catch (error) {
            console.error('질문 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '질문 삭제에 실패했습니다.'
            });
        }
    },

    // 답변 생성
    createAnswer: async (req, res) => {
        try {
            const { questionId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [question] = await connection.execute(
                    'SELECT id FROM questions WHERE id = ? AND deletedAt IS NULL',
                    [questionId]
                );

                if (!question) {
                    throw new Error('질문을 찾을 수 없습니다.');
                }

                const [answer] = await connection.execute(
                    'INSERT INTO answers (questionId, content, authorId) VALUES (?, ?, ?)',
                    [questionId, content, userId]
                );

                return { id: answer.insertId };
            });

            res.status(201).json({
                success: true,
                message: '답변이 등록되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('답변 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '답변 등록에 실패했습니다.'
            });
        }
    },

    // 답변 수정
    updateAnswer: async (req, res) => {
        try {
            const { answerId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const [answer] = await connection.execute(
                    'SELECT authorId FROM answers WHERE id = ? AND deletedAt IS NULL',
                    [answerId]
                );

                if (!answer || answer.authorId !== userId) {
                    throw new Error('수정 권한이 없습니다.');
                }

                await connection.execute(
                    'UPDATE answers SET content = ? WHERE id = ?',
                    [content, answerId]
                );
            });

            res.status(200).json({
                success: true,
                message: '답변이 수정되었습니다.'
            });
        } catch (error) {
            console.error('답변 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '답변 수정에 실패했습니다.'
            });
        }
    },

    // 답변 삭제
    deleteAnswer: async (req, res) => {
        try {
            const { answerId } = req.params;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const [answer] = await connection.execute(
                    'SELECT authorId FROM answers WHERE id = ? AND deletedAt IS NULL',
                    [answerId]
                );

                if (!answer || answer.authorId !== userId) {
                    throw new Error('삭제 권한이 없습니다.');
                }

                await connection.execute(
                    'UPDATE answers SET deletedAt = NOW() WHERE id = ?',
                    [answerId]
                );
            });

            res.status(200).json({
                success: true,
                message: '답변이 삭제되었습니다.'
            });
        } catch (error) {
            console.error('답변 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '답변 삭제에 실패했습니다.'
            });
        }
    },

    // 스터디 그룹 생성
    createStudyGroup: async (req, res) => {
        try {
            const { name, category, description } = req.body;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [group] = await connection.execute(
                    'INSERT INTO study_groups (name, category, description, leaderId) VALUES (?, ?, ?, ?)',
                    [name, category, description, userId]
                );

                await connection.execute(
                    'INSERT INTO study_group_members (groupId, memberId, role) VALUES (?, ?, "leader")',
                    [group.insertId, userId]
                );

                return { id: group.insertId };
            });

            res.status(201).json({
                success: true,
                message: '스터디 그룹이 생성되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('스터디 그룹 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '스터디 그룹 생성에 실패했습니다.'
            });
        }
    },

    // 스터디 그룹 상세 조회
    getStudyGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            const [group] = await utils.executeQuery(`
        SELECT sg.*, u.username as leaderName,
               COUNT(DISTINCT sgm.memberId) as memberCount,
               EXISTS(SELECT 1 FROM study_group_members sgm2 
                     WHERE sgm2.groupId = sg.id AND sgm2.memberId = ?) as isMember,
               JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'memberId', u2.id,
                   'username', u2.username,
                   'name', u2.name,
                   'role', sgm.role
                 )
               ) as members
        FROM study_groups sg
        JOIN users u ON sg.leaderId = u.id
        LEFT JOIN study_group_members sgm ON sg.id = sgm.groupId
        LEFT JOIN users u2 ON sgm.memberId = u2.id
        WHERE sg.id = ? AND sg.deletedAt IS NULL
        GROUP BY sg.id
      `, [userId, groupId]);

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: '스터디 그룹을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: group
            });
        } catch (error) {
            console.error('스터디 그룹 상세 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '스터디 그룹 상세 조회에 실패했습니다.'
            });
        }
    },

    // 멘토 등록
    registerMentor: async (req, res) => {
        try {
            const { field, experience, introduction } = req.body;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [existingMentor] = await connection.execute(
                    'SELECT id FROM mentors WHERE memberId = ? AND status = "active"',
                    [userId]
                );

                if (existingMentor) {
                    throw new Error('이미 멘토로 등록되어 있습니다.');
                }

                const [mentor] = await connection.execute(`
          INSERT INTO mentors (memberId, field, experience, introduction, rating, status)
          VALUES (?, ?, ?, ?, 0, 'active')
        `, [userId, field, experience, introduction]);

                return { id: mentor.insertId, field, experience, introduction };
            });

            res.status(201).json({
                success: true,
                message: '멘토로 등록되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('멘토 등록 오류:', error);
            res.status(500).json({
                success: false,
                message: '멘토 등록에 실패했습니다.'
            });
        }
    },

    // 멘토 상세 정보 조회
    getMentorDetail: async (req, res) => {
        try {
            const { mentorId } = req.params;

            const [mentor] = await utils.executeQuery(`
        SELECT m.*, 
               u.username, u.name, u.email, u.profileImage,
               COUNT(DISTINCT mc.id) as consultingCount,
               AVG(mr.rating) as averageRating
        FROM mentors m
        JOIN users u ON m.memberId = u.id
        LEFT JOIN mentor_consultings mc ON m.id = mc.mentorId
        LEFT JOIN mentor_reviews mr ON m.id = mr.mentorId
        WHERE m.id = ? AND m.status = 'active'
        GROUP BY m.id
      `, [mentorId]);

            if (!mentor) {
                return res.status(404).json({
                    success: false,
                    message: '멘토를 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: mentor
            });
        } catch (error) {
            console.error('멘토 상세 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '멘토 상세 정보 조회에 실패했습니다.'
            });
        }
    },

    // 멘토와 채팅 시작
    startMentorChat: async (req, res) => {
        try {
            const { mentorId } = req.params;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [mentor] = await connection.execute(
                    'SELECT memberId FROM mentors WHERE id = ? AND status = "active"',
                    [mentorId]
                );

                if (!mentor) {
                    throw new Error('멘토를 찾을 수 없습니다.');
                }

                const [room] = await connection.execute(`
          INSERT INTO chat_rooms (type, name, createdAt)
          VALUES ('mentoring', '멘토링 채팅', NOW())
        `);

                await connection.execute(`
          INSERT INTO chat_room_participants (roomId, memberId, role)
          VALUES (?, ?, 'mentee'), (?, ?, 'mentor')
        `, [room.insertId, userId, room.insertId, mentor.memberId]);

                return {
                    roomId: room.insertId,
                    mentorId: mentorId,
                    menteeId: userId
                };
            });

            res.status(201).json({
                success: true,
                message: '멘토와의 채팅이 시작되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('멘토 채팅 시작 오류:', error);
            res.status(500).json({
                success: false,
                message: '멘토와의 채팅 시작에 실패했습니다.'
            });
        }
    }
};

module.exports = communityController;
const { dbUtils } = require('../config/db');

const communityService = {
    // 질문 유효성 검사
    async validateQuestion(data) {
        try {
            const { title, content } = data;
            if (title.length < 5 || title.length > 200) {
                throw new Error('제목은 5~200자 사이여야 합니다');
            }
            if (content.length < 10) {
                throw new Error('내용은 최소 10자 이상이어야 합니다');
            }
            return { success: true };
        } catch (error) {
            throw new Error('질문 유효성 검사 실패: ' + error.message);
        }
    },

    // 질문 생성
    async createQuestion(data) {
        try {
            const query = `
                INSERT INTO questions (userId, title, content)
                VALUES (?, ?, ?)
            `;
            const result = await dbUtils.query(query, [
                req.user.id,
                data.title,
                data.content
            ]);
            return {
                success: true,
                questionId: result.insertId
            };
        } catch (error) {
            throw new Error('질문 생성 실패: ' + error.message);
        }
    },

    // 질문 목록 조회
    async getQuestions(params) {
        try {
            const { page = 1, limit = 20, search = '' } = params;
            const offset = (page - 1) * limit;

            const query = `
                SELECT q.*, u.name as authorName,
                       COUNT(a.id) as answerCount
                FROM questions q
                         JOIN users u ON q.userId = u.id
                         LEFT JOIN answers a ON q.id = a.questionId
                WHERE q.status != 'deleted'
                    AND (q.title LIKE ? OR q.content LIKE ?)
                GROUP BY q.id
                ORDER BY q.createdAt DESC
                    LIMIT ? OFFSET ?
            `;

            const questions = await dbUtils.query(query, [
                `%${search}%`,
                `%${search}%`,
                limit,
                offset
            ]);

            const [{ total }] = await dbUtils.query(
                'SELECT COUNT(*) as total FROM questions WHERE status != "deleted"'
            );

            return {
                questions,
                totalCount: total
            };
        } catch (error) {
            throw new Error('질문 목록 조회 실패: ' + error.message);
        }
    },

    // 질문 상세 조회
    async getQuestion(questionId) {
        try {
            const query = `
                SELECT q.*, u.name as authorName,
                       COUNT(DISTINCT a.id) as answerCount
                FROM questions q
                         JOIN users u ON q.userId = u.id
                         LEFT JOIN answers a ON q.id = a.questionId
                WHERE q.id = ? AND q.status != 'deleted'
                GROUP BY q.id
            `;

            const [question] = await dbUtils.query(query, [questionId]);

            if (!question) {
                throw new Error('질문을 찾을 수 없습니다');
            }

            // 조회수 증가
            await dbUtils.query(
                'UPDATE questions SET viewCount = viewCount + 1 WHERE id = ?',
                [questionId]
            );

            // 답변 목록 조회
            const answersQuery = `
                SELECT a.*, u.name as authorName
                FROM answers a
                         JOIN users u ON a.userId = u.id
                WHERE a.questionId = ?
                ORDER BY a.isAccepted DESC, a.createdAt ASC
            `;
            const answers = await dbUtils.query(answersQuery, [questionId]);

            return {
                question: {
                    ...question,
                    answers
                }
            };
        } catch (error) {
            throw new Error('질문 상세 조회 실패: ' + error.message);
        }
    },

    // 나머지 메서드들도 유사한 패턴으로 구현...
    // createAnswer, updateAnswer, deleteAnswer 등

    // 스터디 그룹 생성
    async createStudyGroup(data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO study_groups (name, category, description)
                    VALUES (?, ?, ?)
                `, [data.name, data.category, data.description]);

                await connection.query(`
                    INSERT INTO study_group_members (groupId, userId, role)
                    VALUES (?, ?, 'admin')
                `, [result.insertId, req.user.id]);

                return {
                    success: true,
                    groupId: result.insertId
                };
            } catch (error) {
                throw new Error('스터디 그룹 생성 실패: ' + error.message);
            }
        });
    },

    // 멘토 등록
    async registerMentor(data) {
        try {
            const query = `
                INSERT INTO mentors (userId, field, experience, introduction)
                VALUES (?, ?, ?, ?)
            `;
            const result = await dbUtils.query(query, [
                req.user.id,
                data.field,
                data.experience,
                data.introduction
            ]);

            return {
                success: true,
                mentorId: result.insertId
            };
        } catch (error) {
            throw new Error('멘토 등록 실패: ' + error.message);
        }
    },

    // 질문 수정
    async updateQuestion(questionId, userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [question] = await connection.query(
                    'SELECT * FROM questions WHERE id = ? AND userId = ?',
                    [questionId, userId]
                );

                if (!question) {
                    throw new Error('질문을 찾을 수 없거나 수정 권한이 없습니다');
                }

                await connection.query(`
                UPDATE questions 
                SET title = ?,
                    content = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `, [data.title, data.content, questionId]);

                return { success: true };
            } catch (error) {
                throw new Error('질문 수정 실패: ' + error.message);
            }
        });
    },

// 질문 삭제
    async deleteQuestion(questionId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const result = await connection.query(
                    'UPDATE questions SET status = "deleted" WHERE id = ? AND userId = ?',
                    [questionId, userId]
                );

                if (result.affectedRows === 0) {
                    throw new Error('질문을 찾을 수 없거나 삭제 권한이 없습니다');
                }

                return { success: true };
            } catch (error) {
                throw new Error('질문 삭제 실패: ' + error.message);
            }
        });
    },

// 답변 작성
    async createAnswer(questionId, userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [question] = await connection.query(
                    'SELECT * FROM questions WHERE id = ? AND status = "open"',
                    [questionId]
                );

                if (!question) {
                    throw new Error('답변을 작성할 수 없는 질문입니다');
                }

                const [result] = await connection.query(`
                INSERT INTO answers (questionId, userId, content)
                VALUES (?, ?, ?)
            `, [questionId, userId, data.content]);

                return { answerId: result.insertId };
            } catch (error) {
                throw new Error('답변 작성 실패: ' + error.message);
            }
        });
    },

// 답변 삭제
    async deleteAnswer(answerId, userId) {
        try {
            const result = await dbUtils.query(
                'UPDATE answers SET deletedAt = NOW() WHERE id = ? AND userId = ?',
                [answerId, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('답변을 찾을 수 없거나 삭제 권한이 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('답변 삭제 실패: ' + error.message);
        }
    },

// 답변 수정
    async updateAnswer(answerId, userId, data) {
        try {
            const result = await dbUtils.query(`
            UPDATE answers 
            SET content = ?,
                updatedAt = NOW()
            WHERE id = ? AND userId = ?
        `, [data.content, answerId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('답변을 찾을 수 없거나 수정 권한이 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('답변 수정 실패: ' + error.message);
        }
    },

// 커뮤니티 데이터 조회
    async getData(tab) {
        try {
            let query;
            switch (tab) {
                case 'questions':
                    query = `
                    SELECT q.*, u.name as authorName,
                           COUNT(a.id) as answerCount
                    FROM questions q
                    LEFT JOIN users u ON q.userId = u.id
                    LEFT JOIN answers a ON q.id = a.questionId
                    WHERE q.status = 'open'
                    GROUP BY q.id
                    ORDER BY q.createdAt DESC
                `;
                    break;
                case 'groups':
                    query = `
                    SELECT * FROM study_groups
                    WHERE status = 'active'
                    ORDER BY createdAt DESC
                `;
                    break;
                case 'mentors':
                    query = `
                    SELECT m.*, u.name, u.profileImage
                    FROM mentors m
                    JOIN users u ON m.userId = u.id
                    WHERE m.status = 'active'
                    ORDER BY m.rating DESC
                `;
                    break;
                default:
                    throw new Error('유효하지 않은 탭입니다');
            }

            const data = await dbUtils.query(query);
            return { data };
        } catch (error) {
            throw new Error('커뮤니티 데이터 조회 실패: ' + error.message);
        }
    },

// 스터디 그룹 상세 조회
    async getStudyGroup(groupId) {
        try {
            const query = `
            SELECT sg.*, 
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'id', u.id,
                           'name', u.name,
                           'profileImage', u.profileImage
                       )
                   ) as members
            FROM study_groups sg
            LEFT JOIN study_group_members sgm ON sg.id = sgm.groupId
            LEFT JOIN users u ON sgm.userId = u.id
            WHERE sg.id = ?
            GROUP BY sg.id
        `;
            const [group] = await dbUtils.query(query, [groupId]);

            if (!group) {
                throw new Error('스터디 그룹을 찾을 수 없습니다');
            }

            return { group };
        } catch (error) {
            throw new Error('스터디 그룹 조회 실패: ' + error.message);
        }
    },

// 멘토 상세 정보 조회
    async getMentorDetail(mentorId) {
        try {
            const query = `
            SELECT m.*, u.name, u.profileImage,
                   COUNT(DISTINCT mc.id) as chatCount,
                   AVG(mr.rating) as averageRating
            FROM mentors m
            JOIN users u ON m.userId = u.id
            LEFT JOIN mentor_chats mc ON m.id = mc.mentorId
            LEFT JOIN mentor_reviews mr ON m.id = mr.mentorId
            WHERE m.id = ?
            GROUP BY m.id
        `;
            const [mentor] = await dbUtils.query(query, [mentorId]);

            if (!mentor) {
                throw new Error('멘토를 찾을 수 없습니다');
            }

            return { mentor };
        } catch (error) {
            throw new Error('멘토 정보 조회 실패: ' + error.message);
        }
    },

// 멘토링 채팅 시작
    async startMentorChat(mentorId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [mentor] = await connection.query(
                    'SELECT * FROM mentors WHERE id = ? AND status = "active"',
                    [mentorId]
                );

                if (!mentor) {
                    throw new Error('멘토를 찾을 수 없습니다');
                }

                const [result] = await connection.query(`
                INSERT INTO mentor_chats (mentorId, userId, status)
                VALUES (?, ?, 'active')
            `, [mentorId, userId]);

                return { chatId: result.insertId };
            } catch (error) {
                throw new Error('멘토링 채팅 시작 실패: ' + error.message);
            }
        });
    }
};

module.exports = communityService;
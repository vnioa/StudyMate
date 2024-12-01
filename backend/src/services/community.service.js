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
    }
};

module.exports = communityService;
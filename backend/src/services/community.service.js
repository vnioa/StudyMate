const { dbUtils } = require('../config/db');

const communityService = {
    // 질문 유효성 검사
    async validateQuestion(title, content) {
        try {
            if (!title || title.length < 2 || title.length > 200) {
                throw new Error('제목은 2-200자 사이여야 합니다.');
            }
            if (!content || content.length < 10) {
                throw new Error('내용은 최소 10자 이상이어야 합니다.');
            }
            return true;
        } catch (error) {
            throw error;
        }
    },

    // 질문 생성
    async createQuestion(questionData) {
        try {
            const query = `
                INSERT INTO questions (memberId, title, content, status, createdAt)
                VALUES (?, ?, ?, 'open', NOW())
            `;
            const [result] = await dbUtils.query(query, [
                questionData.memberId,
                questionData.title,
                questionData.content
            ]);
            return { id: result.insertId, ...questionData };
        } catch (error) {
            throw new Error('질문 생성 실패: ' + error.message);
        }
    },

    // 질문 목록 조회
    async getQuestions(options = {}) {
        try {
            const { page = 1, limit = 10, category, sort } = options;
            const offset = (page - 1) * limit;

            const query = `
                SELECT q.*, u.username, u.name,
                       COUNT(DISTINCT a.id) as answerCount
                FROM questions q
                LEFT JOIN auth u ON q.memberId = u.id
                LEFT JOIN answers a ON q.id = a.questionId
                WHERE q.status = 'open'
                ${category ? 'AND q.category = ?' : ''}
                GROUP BY q.id
                ORDER BY ${sort === 'views' ? 'q.viewCount DESC' : 'q.createdAt DESC'}
                LIMIT ? OFFSET ?
            `;

            const params = category ? [category, limit, offset] : [limit, offset];
            const questions = await dbUtils.query(query, params);

            const [{ total }] = await dbUtils.query(
                'SELECT COUNT(*) as total FROM questions WHERE status = "open"'
            );

            return { questions, total };
        } catch (error) {
            throw new Error('질문 목록 조회 실패: ' + error.message);
        }
    },

    // 질문 상세 조회
    async getQuestionDetail(questionId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const query = `
                    SELECT q.*, u.username, u.name,
                           a.id as answerId, a.content as answerContent,
                           a.isAccepted, a.createdAt as answerCreatedAt,
                           au.username as answerAuthorUsername,
                           au.name as answerAuthorName
                    FROM questions q
                    LEFT JOIN auth u ON q.memberId = u.id
                    LEFT JOIN answers a ON q.id = a.questionId
                    LEFT JOIN auth au ON a.memberId = au.id
                    WHERE q.id = ?
                `;

                const question = await connection.query(query, [questionId]);

                if (question.memberId !== userId) {
                    await connection.query(
                        'UPDATE questions SET viewCount = viewCount + 1 WHERE id = ?',
                        [questionId]
                    );
                }

                return question;
            } catch (error) {
                throw new Error('질문 상세 조회 실패: ' + error.message);
            }
        });
    },

    // 질문 수정
    async updateQuestion(questionId, userId, updateData) {
        try {
            const query = `
                UPDATE questions 
                SET title = ?, content = ?, updatedAt = NOW()
                WHERE id = ? AND memberId = ?
            `;

            const result = await dbUtils.query(query, [
                updateData.title,
                updateData.content,
                questionId,
                userId
            ]);

            if (result.affectedRows === 0) {
                throw new Error('질문을 찾을 수 없거나 수정 권한이 없습니다.');
            }

            return { id: questionId, ...updateData };
        } catch (error) {
            throw new Error('질문 수정 실패: ' + error.message);
        }
    },

    // 질문 삭제
    async deleteQuestion(questionId, userId) {
        try {
            const query = `
                UPDATE questions 
                SET status = 'deleted', deletedAt = NOW()
                WHERE id = ? AND memberId = ?
            `;

            const result = await dbUtils.query(query, [questionId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('질문을 찾을 수 없거나 삭제 권한이 없습니다.');
            }
        } catch (error) {
            throw new Error('질문 삭제 실패: ' + error.message);
        }
    },

    // 답변 생성
    async createAnswer(answerData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [question] = await connection.query(
                    'SELECT status FROM questions WHERE id = ?',
                    [answerData.questionId]
                );

                if (!question || question.status !== 'open') {
                    throw new Error('답변을 작성할 수 없는 질문입니다.');
                }

                const [result] = await connection.query(`
                    INSERT INTO answers (questionId, memberId, content, createdAt)
                    VALUES (?, ?, ?, NOW())
                `, [
                    answerData.questionId,
                    answerData.memberId,
                    answerData.content
                ]);

                return { id: result.insertId, ...answerData };
            } catch (error) {
                throw new Error('답변 생성 실패: ' + error.message);
            }
        });
    },

    // 답변 수정
    async updateAnswer(answerId, userId, content) {
        try {
            const query = `
                UPDATE answers 
                SET content = ?, updatedAt = NOW()
                WHERE id = ? AND memberId = ?
            `;

            const result = await dbUtils.query(query, [content, answerId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('답변을 찾을 수 없거나 수정 권한이 없습니다.');
            }

            return { id: answerId, content };
        } catch (error) {
            throw new Error('답변 수정 실패: ' + error.message);
        }
    },

    // 답변 삭제
    async deleteAnswer(answerId, userId) {
        try {
            const query = `
                UPDATE answers 
                SET deletedAt = NOW()
                WHERE id = ? AND memberId = ?
            `;

            const result = await dbUtils.query(query, [answerId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('답변을 찾을 수 없거나 삭제 권한이 없습니다.');
            }
        } catch (error) {
            throw new Error('답변 삭제 실패: ' + error.message);
        }
    },

    // 커뮤니티 탭별 데이터 조회
    async getCommunityData(tab) {
        try {
            let query;
            switch (tab) {
                case 'questions':
                    query = `
                    SELECT q.*, u.username, u.name,
                           COUNT(a.id) as answerCount
                    FROM questions q
                    LEFT JOIN auth u ON q.memberId = u.id
                    LEFT JOIN answers a ON q.id = a.questionId
                    WHERE q.status = 'open'
                    GROUP BY q.id
                    ORDER BY q.createdAt DESC
                    LIMIT 10
                `;
                    break;
                case 'studyGroups':
                    query = `
                    SELECT sg.*, COUNT(sgm.memberId) as currentMembers
                    FROM study_groups sg
                    LEFT JOIN study_group_members sgm ON sg.id = sgm.groupId
                    WHERE sg.status = 'active'
                    GROUP BY sg.id
                    ORDER BY sg.createdAt DESC
                    LIMIT 10
                `;
                    break;
                case 'mentors':
                    query = `
                    SELECT m.*, u.username, u.name
                    FROM mentors m
                    JOIN auth u ON m.memberId = u.id
                    WHERE m.status = 'active'
                    ORDER BY m.rating DESC
                    LIMIT 10
                `;
                    break;
                default:
                    throw new Error('유효하지 않은 탭입니다.');
            }

            return await dbUtils.query(query);
        } catch (error) {
            throw new Error('커뮤니티 데이터 조회 실패: ' + error.message);
        }
    },

// 스터디 그룹 생성
    async createStudyGroup(groupData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                INSERT INTO study_groups (
                    name, category, description, memberCount, status, createdAt
                ) VALUES (?, ?, ?, 1, 'active', NOW())
            `, [
                    groupData.name,
                    groupData.category,
                    groupData.description
                ]);

                await connection.query(`
                INSERT INTO study_group_members (
                    groupId, memberId, role, joinedAt
                ) VALUES (?, ?, 'admin', NOW())
            `, [result.insertId, groupData.createdBy]);

                return { id: result.insertId, ...groupData };
            } catch (error) {
                throw new Error('스터디 그룹 생성 실패: ' + error.message);
            }
        });
    },

// 스터디 그룹 상세 조회
    async getStudyGroupDetail(groupId) {
        try {
            const [group] = await dbUtils.query(`
            SELECT sg.*,
                   JSON_ARRAYAGG(
                       JSON_OBJECT(
                           'memberId', u.id,
                           'username', u.username,
                           'name', u.name,
                           'role', sgm.role
                       )
                   ) as members
            FROM study_groups sg
            LEFT JOIN study_group_members sgm ON sg.id = sgm.groupId
            LEFT JOIN auth u ON sgm.memberId = u.id
            WHERE sg.id = ?
            GROUP BY sg.id
        `, [groupId]);

            if (!group) {
                throw new Error('스터디 그룹을 찾을 수 없습니다.');
            }

            return group;
        } catch (error) {
            throw new Error('스터디 그룹 상세 조회 실패: ' + error.message);
        }
    },

// 멘토 등록
    async registerMentor(mentorData) {
        try {
            const [result] = await dbUtils.query(`
            INSERT INTO mentors (
                memberId, field, experience, introduction,
                rating, status, createdAt
            ) VALUES (?, ?, ?, ?, 0, 'active', NOW())
        `, [
                mentorData.memberId,
                mentorData.field,
                mentorData.experience,
                mentorData.introduction
            ]);

            return { id: result.insertId, ...mentorData };
        } catch (error) {
            throw new Error('멘토 등록 실패: ' + error.message);
        }
    },

// 멘토 상세 정보 조회
    async getMentorDetail(mentorId) {
        try {
            const [mentor] = await dbUtils.query(`
            SELECT m.*, 
                   u.username, u.name, u.email,
                   u.profileImage
            FROM mentors m
            JOIN auth u ON m.memberId = u.id
            WHERE m.id = ?
        `, [mentorId]);

            if (!mentor) {
                throw new Error('멘토를 찾을 수 없습니다.');
            }

            return mentor;
        } catch (error) {
            throw new Error('멘토 상세 정보 조회 실패: ' + error.message);
        }
    },

// 멘토와 채팅 시작
    async startMentorChat(mentorId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [mentor] = await connection.query(
                    'SELECT * FROM mentors WHERE id = ? AND status = "active"',
                    [mentorId]
                );

                if (!mentor) {
                    throw new Error('멘토를 찾을 수 없습니다.');
                }

                const [result] = await connection.query(`
                INSERT INTO chat_rooms (
                    type, name, createdAt
                ) VALUES ('individual', '멘토링 채팅', NOW())
            `);

                const roomId = result.insertId;

                await connection.query(`
                INSERT INTO chat_room_participants 
                (roomId, memberId, role) VALUES 
                (?, ?, 'member'), (?, ?, 'admin')
            `, [roomId, userId, roomId, mentor.memberId]);

                return { id: roomId, type: 'individual', name: '멘토링 채팅' };
            } catch (error) {
                throw new Error('멘토와의 채팅 시작 실패: ' + error.message);
            }
        });
    }
};

module.exports = communityService;
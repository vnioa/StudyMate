const db = require('../../config/mysql');

class CommunityService {
    // 스터디 그룹 생성
    async createStudyGroup(groupData) {
        try {
            const { name, description, creatorId, category, maxMembers } = groupData;

            const [result] = await db.execute(
                'INSERT INTO study_groups (name, description, creator_id, category, max_members) VALUES (?, ?, ?, ?, ?)',
                [name, description, creatorId, category, maxMembers]
            );

            // 생성자를 그룹의 첫 멤버이자 관리자로 추가
            await db.execute(
                'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
                [result.insertId, creatorId, 'admin']
            );

            return result.insertId;
        } catch (error) {
            console.error('그룹 생성 오류:', error);
            throw new Error('그룹 생성에 실패했습니다.');
        }
    }

    // Q&A 게시글 작성
    async createQuestion(questionData) {
        try {
            const { userId, groupId, title, content, tags } = questionData;

            const [result] = await db.execute(
                'INSERT INTO group_questions (user_id, group_id, title, content, tags) VALUES (?, ?, ?, ?, ?)',
                [userId, groupId, title, content, JSON.stringify(tags)]
            );

            return result.insertId;
        } catch (error) {
            console.error('질문 작성 오류:', error);
            throw new Error('질문 작성에 실패했습니다.');
        }
    }

    // 답변 작성
    async createAnswer(answerData) {
        try {
            const { userId, questionId, content } = answerData;

            const [result] = await db.execute(
                'INSERT INTO question_answers (user_id, question_id, content) VALUES (?, ?, ?)',
                [userId, questionId, content]
            );

            return result.insertId;
        } catch (error) {
            console.error('답변 작성 오류:', error);
            throw new Error('답변 작성에 실패했습니다.');
        }
    }

    // 멘토-멘티 매칭
    async createMentoring(mentoringData) {
        try {
            const { mentorId, menteeId, groupId, subject } = mentoringData;

            const [result] = await db.execute(
                'INSERT INTO mentoring_relationships (mentor_id, mentee_id, group_id, subject) VALUES (?, ?, ?, ?)',
                [mentorId, menteeId, groupId, subject]
            );

            return result.insertId;
        } catch (error) {
            console.error('멘토링 매칭 오류:', error);
            throw new Error('멘토링 매칭에 실패했습니다.');
        }
    }

    // 그룹 채팅 메시지 저장
    async saveMessage(messageData) {
        try {
            const { userId, groupId, content, type } = messageData;

            const [result] = await db.execute(
                'INSERT INTO group_messages (user_id, group_id, content, type) VALUES (?, ?, ?, ?)',
                [userId, groupId, content, type]
            );

            return result.insertId;
        } catch (error) {
            console.error('메시지 저장 오류:', error);
            throw new Error('메시지 저장에 실패했습니다.');
        }
    }
}

module.exports = new CommunityService();
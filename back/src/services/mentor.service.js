const { dbUtils } = require('../config/database.config');

const mentorService = {
    // 멘토 정보 유효성 검사
    async validateMentorInfo(mentorData) {
        try {
            if (!mentorData.name || mentorData.name.length < 2) {
                throw new Error('이름은 2자 이상이어야 합니다.');
            }
            if (!mentorData.field || mentorData.field.length < 2) {
                throw new Error('전문 분야는 2자 이상이어야 합니다.');
            }
            if (!mentorData.career || mentorData.career.length < 10) {
                throw new Error('경력 사항은 10자 이상이어야 합니다.');
            }
            if (!mentorData.introduction || mentorData.introduction.length < 10) {
                throw new Error('자기 소개는 10자 이상이어야 합니다.');
            }
            return true;
        } catch (error) {
            throw error;
        }
    },

    // 멘토 프로필 이미지 업로드
    async uploadMentorImage(userId, image) {
        try {
            // 이미지 업로드 로직 구현 필요
            const imageUrl = `uploads/mentors/${userId}/${image.filename}`;

            await dbUtils.query(`
                UPDATE mentors
                SET profileImage = ?, updatedAt = NOW()
                WHERE memberId = ?
            `, [imageUrl, userId]);

            return imageUrl;
        } catch (error) {
            throw new Error('프로필 이미지 업로드 실패: ' + error.message);
        }
    },

    // 멘토 등록
    async registerMentor(mentorData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 이미 멘토로 등록되어 있는지 확인
                const [existingMentor] = await connection.query(
                    'SELECT id FROM mentors WHERE memberId = ?',
                    [mentorData.memberId]
                );

                if (existingMentor) {
                    throw new Error('이미 멘토로 등록되어 있습니다.');
                }

                const [result] = await connection.query(`
                    INSERT INTO mentors (
                        memberId, field, career, introduction,
                        education, skills, availableTime,
                        profileImage, status, verificationStatus,
                        hourlyRate, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    mentorData.memberId,
                    mentorData.field,
                    mentorData.career,
                    mentorData.introduction,
                    mentorData.education || null,
                    mentorData.skills || null,
                    JSON.stringify(mentorData.availableTime || {}),
                    mentorData.profileImage || null,
                    mentorData.status,
                    mentorData.verificationStatus,
                    mentorData.hourlyRate || 0
                ]);

                return { id: result.insertId, ...mentorData };
            } catch (error) {
                throw new Error('멘토 등록 실패: ' + error.message);
            }
        });
    },

    // 멘토 정보 조회
    async getMentorInfo(mentorId) {
        try {
            const query = `
                SELECT m.*, 
                       a.username, a.name, a.email, a.profileImage as userProfileImage,
                       COUNT(DISTINCT mr.id) as reviewCount,
                       AVG(mr.rating) as averageRating
                FROM mentors m
                JOIN auth a ON m.memberId = a.id
                LEFT JOIN mentor_reviews mr ON m.id = mr.mentorId
                WHERE m.id = ?
                GROUP BY m.id
            `;

            const [mentor] = await dbUtils.query(query, [mentorId]);

            if (mentor) {
                // 인증 정보 조회
                const verifications = await dbUtils.query(`
                    SELECT * FROM mentor_verifications
                    WHERE mentorId = ? AND status = 'verified'
                `, [mentorId]);

                mentor.verifications = verifications;
            }

            return mentor;
        } catch (error) {
            throw new Error('멘토 정보 조회 실패: ' + error.message);
        }
    },

    // 멘토 정보 수정
    async updateMentorInfo(mentorId, userId, updateData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [mentor] = await connection.query(
                    'SELECT * FROM mentors WHERE id = ? AND memberId = ?',
                    [mentorId, userId]
                );

                if (!mentor) {
                    throw new Error('멘토 정보를 찾을 수 없거나 수정 권한이 없습니다.');
                }

                await connection.query(`
                    UPDATE mentors
                    SET field = ?,
                        career = ?,
                        introduction = ?,
                        education = ?,
                        skills = ?,
                        availableTime = ?,
                        hourlyRate = ?,
                        updatedAt = NOW()
                    WHERE id = ?
                `, [
                    updateData.field,
                    updateData.career,
                    updateData.introduction,
                    updateData.education || null,
                    updateData.skills || null,
                    JSON.stringify(updateData.availableTime || {}),
                    updateData.hourlyRate || mentor.hourlyRate,
                    mentorId
                ]);

                return { id: mentorId, ...updateData };
            } catch (error) {
                throw new Error('멘토 정보 수정 실패: ' + error.message);
            }
        });
    }
};

module.exports = mentorService;
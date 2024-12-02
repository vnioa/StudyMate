const { Mentor, MentorReview, MentorVerification } = require('../models');
const { dbUtils } = require('../config/db');
const { uploadImage, deleteImage } = require('../utils/fileUpload');

const mentorService = {
    // 멘토 정보 유효성 검사
    async validateMentorInfo(data) {
        try {
            const { name, field, career, introduction } = data;

            // 필수 필드 검증
            if (!name || !field || !career || !introduction) {
                throw new Error('필수 정보가 누락되었습니다');
            }

            // 이름 길이 검증
            if (name.length < 2 || name.length > 100) {
                throw new Error('이름은 2-100자 사이여야 합니다');
            }

            // 분야 검증
            const validFields = ['programming', 'design', 'marketing', 'business'];
            if (!validFields.includes(field)) {
                throw new Error('유효하지 않은 분야입니다');
            }

            return { isValid: true };
        } catch (error) {
            throw new Error('멘토 정보 검증 실패: ' + error.message);
        }
    },

    // 멘토 프로필 이미지 업로드
    async uploadMentorImage(file) {
        try {
            if (!file) {
                throw new Error('이미지 파일이 필요합니다');
            }

            const imageUrl = await uploadImage(file);
            return { imageUrl };
        } catch (error) {
            throw new Error('이미지 업로드 실패: ' + error.message);
        }
    },

    // 멘토 등록
    async registerMentor(data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 멘토 확인
                const [existingMentor] = await connection.query(
                    'SELECT id FROM mentors WHERE userId = ?',
                    [data.userId]
                );

                if (existingMentor) {
                    throw new Error('이미 등록된 멘토입니다');
                }

                // 멘토 등록
                const [result] = await connection.query(`
                    INSERT INTO mentors (
                        userId, name, field, career, introduction,
                        education, skills, availableTime, profileImage
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    data.userId,
                    data.name,
                    data.field,
                    data.career,
                    data.introduction,
                    data.education || null,
                    data.skills || null,
                    data.availableTime || null,
                    data.profileImage || null
                ]);

                // 인증 문서 등록
                if (data.verificationDocuments) {
                    for (const doc of data.verificationDocuments) {
                        await connection.query(`
                            INSERT INTO mentor_verifications (
                                mentorId, documentType, documentUrl
                            ) VALUES (?, ?, ?)
                        `, [result.insertId, doc.type, doc.url]);
                    }
                }

                return { mentorId: result.insertId };
            } catch (error) {
                throw new Error('멘토 등록 실패: ' + error.message);
            }
        });
    },

    // 멘토 정보 조회
    async getMentorInfo(mentorId) {
        try {
            const query = `
                SELECT m.*, u.email,
                       COUNT(DISTINCT mr.id) as reviewCount,
                       AVG(mr.rating) as averageRating
                FROM mentors m
                JOIN users u ON m.userId = u.id
                LEFT JOIN mentor_reviews mr ON m.id = mr.mentorId
                WHERE m.id = ?
                GROUP BY m.id
            `;
            const [mentor] = await dbUtils.query(query, [mentorId]);

            if (!mentor) {
                throw new Error('멘토를 찾을 수 없습니다');
            }

            // 리뷰 조회
            const reviews = await dbUtils.query(`
                SELECT mr.*, u.name as reviewerName
                FROM mentor_reviews mr
                JOIN users u ON mr.reviewerId = u.id
                WHERE mr.mentorId = ?
                ORDER BY mr.createdAt DESC
            `, [mentorId]);

            // 인증 정보 조회
            const verifications = await dbUtils.query(`
                SELECT * FROM mentor_verifications
                WHERE mentorId = ?
                ORDER BY createdAt DESC
            `, [mentorId]);

            return {
                ...mentor,
                reviews,
                verifications
            };
        } catch (error) {
            throw new Error('멘토 정보 조회 실패: ' + error.message);
        }
    },

    // 멘토 정보 수정
    async updateMentorInfo(mentorId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 멘토 존재 확인
                const [mentor] = await connection.query(
                    'SELECT * FROM mentors WHERE id = ?',
                    [mentorId]
                );

                if (!mentor) {
                    throw new Error('멘토를 찾을 수 없습니다');
                }

                // 프로필 이미지 업데이트
                if (data.profileImage && mentor.profileImage) {
                    await deleteImage(mentor.profileImage);
                }

                // 멘토 정보 업데이트
                await connection.query(`
                    UPDATE mentors
                    SET name = ?,
                        field = ?,
                        career = ?,
                        introduction = ?,
                        education = ?,
                        skills = ?,
                        availableTime = ?,
                        profileImage = ?,
                        status = ?
                    WHERE id = ?
                `, [
                    data.name,
                    data.field,
                    data.career,
                    data.introduction,
                    data.education,
                    data.skills,
                    data.availableTime,
                    data.profileImage || mentor.profileImage,
                    data.status || mentor.status,
                    mentorId
                ]);

                return { success: true };
            } catch (error) {
                throw new Error('멘토 정보 수정 실패: ' + error.message);
            }
        });
    }
};

module.exports = mentorService;
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
    },

    validateMentorData(data) {
        if (!data.name || data.name.length < 2) {
            throw new Error('이름은 2자 이상이어야 합니다.');
        }
        if (!data.field || data.field.length < 2) {
            throw new Error('전문 분야는 2자 이상이어야 합니다.');
        }
        if (!data.career || data.career.length < 10) {
            throw new Error('경력 사항은 10자 이상이어야 합니다.');
        }
        if (!data.introduction || data.introduction.length < 10) {
            throw new Error('자기 소개는 10자 이상이어야 합니다.');
        }
    }
};

const mentorController = {
    // 멘토 정보 유효성 검사
    validateMentorInfo: async (req, res) => {
        try {
            const { name, field, career, introduction } = req.body;
            utils.validateMentorData({ name, field, career, introduction });

            res.status(200).json({
                success: true,
                message: '유효한 멘토 정보입니다.'
            });
        } catch (error) {
            console.error('멘토 정보 유효성 검사 오류:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // 멘토 프로필 이미지 업로드
    uploadMentorImage: async (req, res) => {
        try {
            const userId = req.user.id;
            const image = req.file;

            if (!image) {
                return res.status(400).json({
                    success: false,
                    message: '이미지 파일이 필요합니다.'
                });
            }

            const imageUrl = `uploads/mentors/${userId}/${image.filename}`;
            await utils.executeQuery(`
        UPDATE mentors
        SET profileImage = ?, updatedAt = NOW()
        WHERE memberId = ?
      `, [imageUrl, userId]);

            res.status(200).json({
                success: true,
                message: '프로필 이미지가 업로드되었습니다.',
                data: { imageUrl }
            });
        } catch (error) {
            console.error('프로필 이미지 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '프로필 이미지 업로드에 실패했습니다.'
            });
        }
    },

    // 멘토 등록
    registerMentor: async (req, res) => {
        try {
            const userId = req.user.id;
            const mentorData = {
                ...req.body,
                memberId: userId,
                status: 'active',
                verificationStatus: 'pending',
                profileImage: req.file ? `uploads/mentors/${userId}/${req.file.filename}` : null
            };

            utils.validateMentorData(mentorData);

            const result = await utils.executeTransaction(async (connection) => {
                const [existingMentor] = await connection.execute(
                    'SELECT id FROM mentors WHERE memberId = ?',
                    [userId]
                );

                if (existingMentor) {
                    throw new Error('이미 멘토로 등록되어 있습니다.');
                }

                const [mentor] = await connection.execute(`
          INSERT INTO mentors (
            memberId, field, career, introduction,
            education, skills, availableTime,
            profileImage, status, verificationStatus,
            hourlyRate, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
                    userId,
                    mentorData.field,
                    mentorData.career,
                    mentorData.introduction,
                    mentorData.education || null,
                    mentorData.skills || null,
                    JSON.stringify(mentorData.availableTime || {}),
                    mentorData.profileImage,
                    mentorData.status,
                    mentorData.verificationStatus,
                    mentorData.hourlyRate || 0
                ]);

                return { id: mentor.insertId, ...mentorData };
            });

            res.status(201).json({
                success: true,
                message: '멘토 등록이 완료되었습니다.',
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

    // 멘토 정보 조회
    getMentorInfo: async (req, res) => {
        try {
            const { mentorId } = req.params;

            const [mentor] = await utils.executeQuery(`
        SELECT m.*, 
               a.username, a.name, a.email, a.profileImage as userProfileImage,
               COUNT(DISTINCT mr.id) as reviewCount,
               AVG(mr.rating) as averageRating
        FROM mentors m
        JOIN auth a ON m.memberId = a.id
        LEFT JOIN mentor_reviews mr ON m.id = mr.mentorId
        WHERE m.id = ?
        GROUP BY m.id
      `, [mentorId]);

            if (!mentor) {
                return res.status(404).json({
                    success: false,
                    message: '멘토 정보를 찾을 수 없습니다.'
                });
            }

            const verifications = await utils.executeQuery(`
        SELECT * FROM mentor_verifications
        WHERE mentorId = ? AND status = 'verified'
      `, [mentorId]);

            mentor.verifications = verifications;

            res.status(200).json({
                success: true,
                data: mentor
            });
        } catch (error) {
            console.error('멘토 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '멘토 정보 조회에 실패했습니다.'
            });
        }
    },

    // 멘토 정보 수정
    updateMentorInfo: async (req, res) => {
        try {
            const { mentorId } = req.params;
            const userId = req.user.id;
            const updateData = {
                ...req.body,
                profileImage: req.file ? `uploads/mentors/${userId}/${req.file.filename}` : undefined
            };

            utils.validateMentorData(updateData);

            const result = await utils.executeTransaction(async (connection) => {
                const [mentor] = await connection.execute(
                    'SELECT * FROM mentors WHERE id = ? AND memberId = ?',
                    [mentorId, userId]
                );

                if (!mentor) {
                    throw new Error('멘토 정보를 찾을 수 없거나 수정 권한이 없습니다.');
                }

                const updateFields = [];
                const updateValues = [];

                Object.entries(updateData).forEach(([key, value]) => {
                    if (value !== undefined) {
                        if (key === 'availableTime') {
                            updateFields.push(`${key} = ?`);
                            updateValues.push(JSON.stringify(value));
                        } else {
                            updateFields.push(`${key} = ?`);
                            updateValues.push(value);
                        }
                    }
                });

                updateValues.push(mentorId);

                await connection.execute(`
          UPDATE mentors
          SET ${updateFields.join(', ')},
              updatedAt = NOW()
          WHERE id = ?
        `, updateValues);

                return { id: mentorId, ...updateData };
            });

            res.status(200).json({
                success: true,
                message: '멘토 정보가 수정되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('멘토 정보 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '멘토 정보 수정에 실패했습니다.'
            });
        }
    }
};

module.exports = mentorController;
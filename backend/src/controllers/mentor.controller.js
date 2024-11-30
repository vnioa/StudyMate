const db = require('../config/mysql');
const createError = require('http-errors');
const { uploadToStorage } = require('../utils/fileUpload');

const MentorController = {
    // 멘토 정보 유효성 검사
    validateMentorInfo: async (req, res, next) => {
        try {
            const { name, field, career, introduction } = req.body;

            if (!name || name.length < 2) {
                throw createError(400, '이름은 2자 이상이어야 합니다.');
            }

            if (!field || field.length < 2) {
                throw createError(400, '분야를 입력해주세요.');
            }

            if (!career || career.length < 10) {
                throw createError(400, '경력 사항은 10자 이상 작성해주세요.');
            }

            if (!introduction || introduction.length < 30) {
                throw createError(400, '자기소개는 30자 이상 작성해주세요.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    },

    // 멘토 프로필 이미지 업로드
    uploadMentorImage: async (req, res, next) => {
        try {
            if (!req.file) {
                throw createError(400, '이미지 파일을 선택해주세요.');
            }

            const imageUrl = await uploadToStorage(req.file);
            res.json({ imageUrl });
        } catch (err) {
            next(err);
        }
    },

    // 멘토 등록
    registerMentor: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const {
                name,
                field,
                career,
                introduction,
                education,
                skills,
                availableTime,
                profileImage
            } = req.body;

            await connection.beginTransaction();

            // 이미 멘토로 등록되어 있는지 확인
            const [existing] = await connection.query(
                'SELECT id FROM mentors WHERE user_id = ?',
                [req.user.id]
            );

            if (existing.length) {
                throw createError(400, '이미 멘토로 등록되어 있습니다.');
            }

            const [result] = await connection.query(
                `INSERT INTO mentors (
          user_id, name, field, career, introduction, 
          education, skills, available_time, profile_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.user.id, name, field, career, introduction,
                    education, skills, availableTime, profileImage
                ]
            );

            await connection.commit();
            res.json({
                success: true,
                mentorId: result.insertId
            });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 멘토 정보 조회
    getMentorInfo: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { mentorId } = req.params;

            const [mentor] = await connection.query(
                `SELECT m.*, u.email, u.profile_image as user_profile_image
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

    // 멘토 정보 수정
    updateMentorInfo: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { mentorId } = req.params;
            const {
                field,
                career,
                introduction,
                education,
                skills,
                availableTime
            } = req.body;

            const [mentor] = await connection.query(
                'SELECT user_id FROM mentors WHERE id = ?',
                [mentorId]
            );

            if (!mentor.length) {
                throw createError(404, '멘토를 찾을 수 없습니다.');
            }

            if (mentor[0].user_id !== req.user.id) {
                throw createError(403, '수정 권한이 없습니다.');
            }

            await connection.query(
                `UPDATE mentors 
         SET field = ?, career = ?, introduction = ?,
             education = ?, skills = ?, available_time = ?,
             updated_at = NOW()
         WHERE id = ?`,
                [field, career, introduction, education, skills, availableTime, mentorId]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = MentorController;
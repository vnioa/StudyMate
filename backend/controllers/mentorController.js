const db = require('../config/db');

// 멘토 정보 유효성 검사
const validateMentorInfo = async (req, res) => {
    const { name, field, career, introduction } = req.body;
    try {
        const errors = [];

        if (!name || name.length < 2) {
            errors.push('이름은 2자 이상이어야 합니다.');
        }

        if (!field) {
            errors.push('전문 분야를 입력해주세요.');
        }

        if (!career || career.length < 10) {
            errors.push('경력 사항을 10자 이상 입력해주세요.');
        }

        if (!introduction || introduction.length < 30) {
            errors.push('자기소개는 30자 이상 입력해주세요.');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors.join('\n')
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('멘토 정보 유효성 검사 오류:', error);
        res.status(500).json({
            success: false,
            message: '멘토 정보 유효성 검사에 실패했습니다.'
        });
    }
};

// 멘토 프로필 이미지 업로드
const uploadMentorImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '이미지 파일이 없습니다.'
            });
        }

        res.status(200).json({
            imageUrl: req.file.path
        });
    } catch (error) {
        console.error('멘토 이미지 업로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '이미지 업로드에 실패했습니다.'
        });
    }
};

// 멘토 등록
const registerMentor = async (req, res) => {
    const { name, field, career, introduction, education, skills, availableTime, profileImage } = req.body;
    try {
        const [result] = await db.execute(
            `INSERT INTO mentors 
            (user_id, name, field, career, introduction, education, skills, available_time, profile_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, field, career, introduction, education, skills, availableTime, profileImage]
        );

        res.status(201).json({
            success: true,
            mentorId: result.insertId
        });
    } catch (error) {
        console.error('멘토 등록 오류:', error);
        res.status(500).json({
            success: false,
            message: '멘토 등록에 실패했습니다.'
        });
    }
};

// 멘토 정보 조회
const getMentorInfo = async (req, res) => {
    const { mentorId } = req.params;
    try {
        const [mentor] = await db.execute(
            'SELECT * FROM mentors WHERE mentor_id = ?',
            [mentorId]
        );

        if (mentor.length === 0) {
            return res.status(404).json({
                success: false,
                message: '멘토를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({ mentor: mentor[0] });
    } catch (error) {
        console.error('멘토 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '멘토 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 멘토 정보 수정
const updateMentorInfo = async (req, res) => {
    const { mentorId } = req.params;
    const { field, career, introduction, education, skills, availableTime } = req.body;
    try {
        await db.execute(
            `UPDATE mentors 
             SET field = ?, career = ?, introduction = ?, education = ?, skills = ?, available_time = ? 
             WHERE mentor_id = ?`,
            [field, career, introduction, education, skills, availableTime, mentorId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('멘토 정보 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '멘토 정보 수정에 실패했습니다.'
        });
    }
};

// 멘토 상세 조회
const getMentorDetail = async (req, res) => {
    const { mentorId } = req.params;
    try {
        const [mentor] = await db.execute(
            'SELECT * FROM mentors WHERE mentor_id = ?',
            [mentorId]
        );

        if (mentor.length === 0) {
            return res.status(404).json({
                success: false,
                message: '멘토를 찾을 수 없습니다.'
            });
        }

        res.status(200).json({ mentor: mentor[0] });
    } catch (error) {
        console.error('멘토 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '멘토 정보를 불러오는데 실패했습니다.'
        });
    }
};

// 멘토링 채팅 시작
const startMentorChat = async (req, res) => {
    const { mentorId } = req.params;
    try {
        const [result] = await db.execute(
            'INSERT INTO mentor_chats (mentor_id, user_id) VALUES (?, ?)',
            [mentorId, req.user.id]
        );

        res.status(200).json({ chatId: result.insertId });
    } catch (error) {
        console.error('멘토링 채팅 시작 오류:', error);
        res.status(500).json({
            success: false,
            message: '멘토링 채팅 시작에 실패했습니다.'
        });
    }
};

module.exports = {
    validateMentorInfo,
    uploadMentorImage,
    registerMentor,
    getMentorInfo,
    updateMentorInfo,
    getMentorDetail,
    startMentorChat
};
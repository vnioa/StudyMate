const express = require('express');
const router = express.Router();
const {
    validateMentorInfo,
    uploadMentorImage,
    registerMentor,
    getMentorInfo,
    updateMentorInfo,
    getMentorDetail,
    startMentorChat
} = require('../controllers/mentorController');

// 멘토 정보 유효성 검사
router.post('/validate', validateMentorInfo);

// 멘토 프로필 이미지 업로드
router.post('/image', uploadMentorImage);

// 멘토 등록
router.post('/register', registerMentor);

// 멘토 정보 조회 및 수정
router.get('/:mentorId', getMentorInfo);
router.put('/:mentorId', updateMentorInfo);

// 멘토 상세 조회 (커뮤니티)
router.get('/community/mentors/:mentorId', getMentorDetail);

// 멘토링 채팅 시작
router.post('/:mentorId/chat', startMentorChat);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
    getMyProfile,
    updateStatus
} = require('../controllers/profileController');

// 내 프로필 조회
router.get('/', getMyProfile);

// 상태 메시지 업데이트
router.put('/status', updateStatus);

module.exports = router;
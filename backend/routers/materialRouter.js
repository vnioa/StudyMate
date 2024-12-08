const express = require('express');
const router = express.Router();
const {
    getMaterialDetail,
    updateMaterial,
    shareMaterial,
    getMaterialDownloadUrl
} = require('../controllers/materialController');

// 학습 자료 상세 조회
router.get('/:materialId', getMaterialDetail);

// 학습 자료 수정
router.put('/:materialId', updateMaterial);

// 학습 자료 공유
router.post('/:materialId/share', shareMaterial);

// 학습 자료 다운로드
router.get('/:materialId/download', getMaterialDownloadUrl);

module.exports = router;
const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId, requireFields } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 학습 자료 상세 조회
router.get('/:materialId',
    validateId('materialId'),
    materialController.getMaterialDetail
);

// 학습 자료 수정
router.put('/:materialId',
    validateId('materialId'),
    requireFields(['title', 'description', 'content', 'references']),
    materialController.updateMaterial
);

// 학습 자료 공유
router.post('/:materialId/share',
    validateId('materialId'),
    requireFields(['shareType', 'recipients']),
    materialController.shareMaterial
);

// 학습 자료 다운로드
router.get('/:materialId/download',
    validateId('materialId'),
    materialController.getMaterialDownloadUrl
);

module.exports = router;
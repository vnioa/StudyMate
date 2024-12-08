const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validateId } = require('../middlewares/validator.middleware');

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 파일 목록 조회
router.get('/', fileController.getFiles);

// 파일 타입별 필터링
router.get('/filter/:type',
    fileController.filterFilesByType
);

// 파일 검색
router.get('/search',
    fileController.searchFiles
);

// 파일 공유 설정 업데이트
router.put('/:fileId/share',
    validateId('fileId'),
    fileController.updateFileSharing
);

// 파일 만료일 설정
router.put('/:fileId/expiry',
    validateId('fileId'),
    fileController.setFileExpiry
);

// 파일 미리보기
router.get('/:fileId/preview',
    validateId('fileId'),
    fileController.getFilePreview
);

// 파일 삭제
router.delete('/:fileId',
    validateId('fileId'),
    fileController.deleteFile
);

module.exports = router;
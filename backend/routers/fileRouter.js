const express = require('express');
const router = express.Router();
const {
    getFiles,
    filterFilesByType,
    searchFiles,
    updateFileSharing,
    setFileExpiry,
    getFilePreview,
    deleteFile
} = require('../controllers/fileController');

// 파일 목록 조회
router.get('/', getFiles);

// 파일 타입별 필터링
router.get('/filter/:type', filterFilesByType);

// 파일 검색
router.get('/search', searchFiles);

// 파일 공유 설정 업데이트
router.put('/:fileId/share', updateFileSharing);

// 파일 만료일 설정
router.put('/:fileId/expiry', setFileExpiry);

// 파일 미리보기
router.get('/:fileId/preview', getFilePreview);

// 파일 삭제
router.delete('/:fileId', deleteFile);

module.exports = router;
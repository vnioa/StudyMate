const express = require('express');
const router = express.Router();
const materialController = require('../../controllers/group/material.controller');
const auth = require('../../middleware/group/auth.middleware');
const { isGroupAdmin, isMember } = require('../../middleware/group/role.middleware');
const { upload } = require('../../middleware/group/upload.middleware');

// 학습 자료 업로드
router.post('/:groupId/materials',
    auth,
    isMember(),
    upload.single('file'),
    materialController.uploadMaterial
);

// 학습 자료 목록 조회
router.get('/:groupId/materials',
    auth,
    isMember(),
    materialController.getMaterials
);

// 자료 버전 관리
router.post('/:groupId/materials/:materialId/versions',
    auth,
    isMember(),
    upload.single('file'),
    materialController.createVersion
);

// 자료 삭제
router.delete('/:groupId/materials/:materialId',
    auth,
    isGroupAdmin(),
    materialController.deleteMaterial
);

// 자료 태그 관리
router.put('/:groupId/materials/:materialId/tags',
    auth,
    isMember(),
    materialController.updateTags
);

// 자료 권한 설정
router.put('/:groupId/materials/:materialId/permissions',
    auth,
    isGroupAdmin(),
    materialController.updatePermissions
);

// 자료 다운로드
router.get('/:groupId/materials/:materialId/download',
    auth,
    isMember(),
    materialController.downloadMaterial
);

// 자료 검색
router.get('/:groupId/materials/search',
    auth,
    isMember(),
    materialController.searchMaterials
);

module.exports = router;
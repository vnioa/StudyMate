const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile/info.controller');
const imageController = require('../controllers/profile/image.controller');
const socialController = require('../controllers/profile/social.controller');
const auth = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

// 프로필 정보 관리
router.get('/', auth, profileController.getUserInfo);
router.put('/update', auth, profileController.updateUserInfo);
router.put('/visibility', auth, profileController.updateProfileVisibility);
router.put('/password', auth, profileController.updatePassword);

// 프로필 이미지 관리
router.post('/image/profile', auth, upload.single('image'), imageController.uploadProfileImage);
router.post('/image/background', auth, upload.single('image'), imageController.uploadBackgroundImage);
router.delete('/image/profile', auth, imageController.deleteProfileImage);
router.delete('/image/background', auth, imageController.deleteBackgroundImage);

// 소셜 미디어 계정 연동
router.get('/social', auth, socialController.getSocialConnections);
router.post('/social/connect', auth, socialController.connectSocialAccount);
router.delete('/social/:provider', auth, socialController.disconnectSocialAccount);
router.post('/social/login', socialController.socialLogin);

module.exports = router;
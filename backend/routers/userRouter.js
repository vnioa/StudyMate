const express = require('express');
const multer = require('multer');
const {
    validateName,
    updateName,
    getProfile,
    uploadImage,
    getUserInfo,
    updateUserInfo,
    validatePhone,
    validatePassword,
    updateProfile,
    updatePrivacy,
    changePassword,
    getSocialAccounts,
    getPrimaryAccount,
    setPrimaryAccount,
    disconnectSocialAccount,
    authenticateToken
} = require('../controllers/userController');

const router = express.Router();

// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 이름 관련 라우트
router.post('/validate-name', validateName);
router.put('/name', updateName);

// 프로필 관련 라우트
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/privacy', updatePrivacy);
router.post('/profile/upload-image/:type', upload.single('image'), uploadImage);

// 사용자 정보 관련 라우트
router.get('/info', getUserInfo);
router.put('/info', updateUserInfo);
router.post('/validate-phone', validatePhone);
router.post('/validate-password', validatePassword);

// 계정 관련 라우트
router.put('/password', changePassword);

// 소셜 계정 관련 라우트
router.get('/social-accounts', getSocialAccounts);
router.get('/primary-account', getPrimaryAccount);
router.put('/primary-account/:accountId', setPrimaryAccount);
router.delete('/social-accounts/:accountId', disconnectSocialAccount);

module.exports = router;

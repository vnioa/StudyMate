const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 저장 경로 설정
const UPLOAD_PATH = {
    PROFILE: 'uploads/profiles',
    BACKGROUND: 'uploads/backgrounds',
    STUDY: 'uploads/study',
    GROUP: 'uploads/groups',
    TEMP: 'uploads/temp'
};

// 저장 디렉토리가 없으면 생성
Object.values(UPLOAD_PATH).forEach(path => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
    // 허용할 파일 형식
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// 파일명 생성 함수
const generateFileName = (file, userId) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    return `${userId}_${timestamp}${extension}`;
};

// 스토리지 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.uploadType || 'TEMP';
        const uploadPath = UPLOAD_PATH[type.toUpperCase()] || UPLOAD_PATH.TEMP;
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = req.user ? req.user.id : 'anonymous';
        cb(null, generateFileName(file, userId));
    }
});

// 업로드 제한 설정
const limits = {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 최대 파일 개수
};

// multer 미들웨어 생성
const upload = multer({
    storage,
    fileFilter,
    limits
});

// 에러 핸들링 미들웨어
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '파일 크기가 너무 큽니다. (최대 10MB)'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '파일 개수가 초과되었습니다. (최대 5개)'
            });
        }
    }
    next(err);
};

// 임시 파일 정리 함수
const cleanupTempFiles = async () => {
    try {
        const files = await fs.promises.readdir(UPLOAD_PATH.TEMP);
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(UPLOAD_PATH.TEMP, file);
            const stats = await fs.promises.stat(filePath);
            if (now - stats.mtime.getTime() > ONE_DAY) {
                await fs.promises.unlink(filePath);
            }
        }
    } catch (error) {
        console.error('임시 파일 정리 오류:', error);
    }
};

// 주기적으로 임시 파일 정리 (24시간마다)
setInterval(cleanupTempFiles, 24 * 60 * 60 * 1000);

module.exports = {
    upload,
    handleUploadError,
    UPLOAD_PATH
};
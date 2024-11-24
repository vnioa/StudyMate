const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 저장 경로 설정
const UPLOAD_PATH = {
    PROFILE: 'uploads/profiles',
    BACKGROUND: 'uploads/backgrounds',
    STUDY: 'uploads/study',
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
const generateFileName = (file) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return `${uniqueSuffix}${path.extname(file.originalname)}`;
};

// 스토리지 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.uploadType || 'TEMP';
        const uploadPath = UPLOAD_PATH[type.toUpperCase()] || UPLOAD_PATH.TEMP;
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, generateFileName(file));
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

module.exports = {
    upload,
    handleUploadError,
    UPLOAD_PATH
};
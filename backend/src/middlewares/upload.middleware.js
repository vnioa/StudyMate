const multer = require('multer');
const path = require('path');
const createError = require('http-errors');
const { v4: uuidv4 } = require('uuid');

// 파일 저장소 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 파일 종류에 따른 저장 경로 설정
        let uploadPath = 'uploads/';
        if (file.fieldname === 'profile') {
            uploadPath += 'profiles/';
        } else if (file.fieldname === 'material') {
            uploadPath += 'materials/';
        } else if (file.fieldname === 'study') {
            uploadPath += 'studies/';
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 고유한 파일명 생성
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
    // 허용된 파일 타입 정의
    const allowedTypes = {
        'image': ['image/jpeg', 'image/png', 'image/gif'],
        'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'video': ['video/mp4', 'video/mpeg', 'video/quicktime']
    };

    // 파일 타입 검증
    if (file.fieldname === 'profile' && allowedTypes.image.includes(file.mimetype)) {
        cb(null, true);
    } else if (file.fieldname === 'material' &&
        (allowedTypes.document.includes(file.mimetype) || allowedTypes.image.includes(file.mimetype))) {
        cb(null, true);
    } else if (file.fieldname === 'study' &&
        (allowedTypes.video.includes(file.mimetype) || allowedTypes.document.includes(file.mimetype))) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// Multer 설정
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
        files: 5 // 최대 파일 개수
    }
});

// 에러 핸들링 미들웨어
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(createError(400, '파일 크기가 너무 큽니다.'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return next(createError(400, '파일 개수가 초과되었습니다.'));
        }
        return next(createError(400, '파일 업로드 중 오류가 발생했습니다.'));
    }
    next(err);
};

// 업로드 미들웨어 생성 함수
const createUploadMiddleware = (fieldName, maxCount = 1) => {
    return [
        upload.array(fieldName, maxCount),
        handleUploadError,
        (req, res, next) => {
            if (!req.files || req.files.length === 0) {
                return next(createError(400, '파일이 업로드되지 않았습니다.'));
            }
            next();
        }
    ];
};

module.exports = {
    upload,
    handleUploadError,
    createUploadMiddleware,
    profileUpload: upload.single('profile'),
    materialUpload: upload.array('material', 5),
    studyUpload: upload.array('study', 3)
};
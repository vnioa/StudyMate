const multer = require('multer');
const path = require('path');
const createError = require('http-errors');
const fs = require('fs');

// 파일 저장소 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'profile') {
            uploadPath += 'profiles/';
        } else if (file.fieldname === 'material') {
            uploadPath += 'materials/';
        } else if (file.fieldname === 'study') {
            uploadPath += 'studies/';
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${req.autoIncrementId || 'default'}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
    const allowedExtensions = {
        image: ['.jpg', '.jpeg', '.png', '.gif'],
        document: ['.pdf', '.doc', '.docx'],
        video: ['.mp4', '.mpeg', '.mov']
    };

    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === 'profile' && allowedExtensions.image.includes(ext)) {
        cb(null, true);
    } else if (file.fieldname === 'material' &&
        (allowedExtensions.document.includes(ext) || allowedExtensions.image.includes(ext))) {
        cb(null, true);
    } else if (file.fieldname === 'study' &&
        (allowedExtensions.document.includes(ext) || allowedExtensions.video.includes(ext))) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// 파일 크기 제한을 타입별로 설정
const fileSizeLimits = {
    profile: 5 * 1024 * 1024, // 5MB
    material: 10 * 1024 * 1024, // 10MB
    study: 50 * 1024 * 1024 // 50MB
};

// Multer 인스턴스 생성 함수
const createMulterInstance = (fieldName) => {
    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: fileSizeLimits[fieldName] || 10 * 1024 * 1024,
            files: 1
        }
    });
};

// 에러 핸들링 미들웨어
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const errors = {
            LIMIT_FILE_SIZE: {
                message: '파일 크기가 제한을 초과했습니다.',
                details: '최대 허용 크기: 10MB'
            },
            LIMIT_FILE_COUNT: {
                message: '파일 개수가 초과되었습니다.',
                details: '최대 허용 개수: 1개'
            },
            LIMIT_UNEXPECTED_FILE: {
                message: '예상치 못한 필드명입니다.',
                details: '허용된 필드: profile, material, study'
            }
        };

        const error = errors[err.code] || {
            message: '파일 업로드 중 오류가 발생했습니다.',
            details: err.message
        };

        return next(createError(400, error));
    }
    next(err);
};

// 업로드 미들웨어 생성 함수
const createUploadMiddleware = (fieldName) => {
    const multerInstance = createMulterInstance(fieldName);

    return [
        multerInstance.single(fieldName),
        handleUploadError,
        (req, res, next) => {
            if (!req.file) {
                return next(createError(400, '파일이 업로드되지 않았습니다.'));
            }
            next();
        }
    ];
};

// 파일 메타데이터 처리
const processUploadedFile = (req, res, next) => {
    if (!req.file && !req.files) return next();

    const files = req.files || [req.file];
    files.forEach(file => {
        file.metadata = {
            uploadedAt: new Date(),
            size: file.size,
            mimetype: file.mimetype,
            originName: file.originalname
        };
    });
    next();
};

// 사용 예시
const uploadProfile = createUploadMiddleware('profile');
const uploadMaterial = createUploadMiddleware('material');
const uploadStudy = createUploadMiddleware('study');

module.exports = {
    uploadProfile,
    uploadMaterial,
    uploadStudy,
    handleUploadError,
    processUploadedFile,
    createUploadMiddleware
};
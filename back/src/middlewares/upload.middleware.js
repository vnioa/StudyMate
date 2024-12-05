const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 파일 저장 경로 설정
const getUploadPath = (type) => {
    const baseDir = 'uploads';
    const typeDir = type || 'common';
    const fullPath = path.join(baseDir, typeDir);

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }

    return fullPath;
};

// 파일 필터 설정
const fileFilter = (req, file, cb) => {
    // 허용되는 파일 타입
    const allowedTypes = {
        'image': ['image/jpeg', 'image/png', 'image/gif'],
        'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'video': ['video/mp4', 'video/mpeg', 'video/quicktime'],
        'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg']
    };

    const uploadType = req.params.type || 'image';
    const allowedMimes = allowedTypes[uploadType] || allowedTypes.image;

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원되지 않는 파일 형식입니다.'), false);
    }
};

// 스토리지 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.params.type || 'common';
        const userId = req.user?.id || 'anonymous';
        const uploadPath = path.join(getUploadPath(uploadType), userId.toString());

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}_${random}${ext}`);
    }
});

// 업로드 미들웨어 생성
const createUploadMiddleware = (type) => {
    const limits = {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    };

    return multer({
        storage,
        fileFilter,
        limits
    }).array(type, limits.files);
};

// 업로드된 파일 처리
const processUploadedFile = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            if (req.file) {
                req.files = [req.file];
            } else {
                return next();
            }
        }

        // 파일 정보 가공
        req.files = req.files.map(file => ({
            ...file,
            url: `/uploads/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype
        }));

        next();
    } catch (error) {
        console.error('파일 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 처리 중 오류가 발생했습니다.'
        });
    }
};

// 파일 삭제
const deleteFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.error('파일 삭제 오류:', error);
        throw new Error('파일 삭제에 실패했습니다.');
    }
};

// 에러 핸들러
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '파일 크기가 제한을 초과했습니다.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: '업로드 가능한 파일 수를 초과했습니다.'
            });
        }
    }

    console.error('파일 업로드 오류:', error);
    res.status(500).json({
        success: false,
        message: '파일 업로드 중 오류가 발생했습니다.'
    });
};

module.exports = {
    createUploadMiddleware,
    processUploadedFile,
    deleteFile,
    handleUploadError
};
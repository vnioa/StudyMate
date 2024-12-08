const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const createError = require('http-errors');

// Firebase Storage 초기화
const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!file.mimetype) {
        cb(createError(400, '파일 형식을 확인할 수 없습니다.'), false);
        return;
    }

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(createError(400, '지원하지 않는 파일 형식입니다.'), false);
    }
};

// Multer 미들웨어 설정
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Firebase Storage에 파일 업로드
const uploadToStorage = async (file) => {
    if (!file) {
        throw createError(400, '파일이 없습니다.');
    }

    const filePath = file.path;
    if (!filePath) {
        throw createError(400, '파일 경로가 없습니다.');
    }

    try {
        const fileName = `${Date.now()}-${file.filename}`;
        const destination = `images/${fileName}`;

        const metadata = {
            contentType: file.mimetype,
            metadata: {
                originalname: file.originalname,
                encoding: file.encoding
            }
        };

        await bucket.upload(filePath, {
            destination,
            metadata
        });

        // 임시 파일 삭제
        await fs.unlink(filePath);

        // 파일의 공개 URL 생성
        const fileRef = bucket.file(destination);
        const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '2100-01-01'
        });

        return url;
    } catch (error) {
        // 업로드 실패 시 임시 파일 삭제 시도
        try {
            await fs.unlink(filePath);
        } catch (unlinkError) {
            console.error('임시 파일 삭제 실패:', unlinkError);
        }

        console.error('파일 업로드 실패:', error);
        throw createError(500, '파일 업로드에 실패했습니다.');
    }
};

// 파일 삭제
const deleteFile = async (fileUrl) => {
    if (!fileUrl) {
        throw createError(400, '파일 URL이 없습니다.');
    }

    try {
        const fileName = path.basename(fileUrl);
        const file = bucket.file(`images/${fileName}`);
        const [exists] = await file.exists();

        if (!exists) {
            throw createError(404, '파일을 찾을 수 없습니다.');
        }

        await file.delete();
        return true;
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        throw createError(500, '파일 삭제에 실패했습니다.');
    }
};

// 이미지 리사이징
const resizeImage = async (file, options = { width: 800, height: 800 }) => {
    if (!file || !file.path) {
        throw createError(400, '유효하지 않은 파일입니다.');
    }

    try {
        const sharp = require('sharp');
        const resizedImage = await sharp(file.path)
            .resize(options.width, options.height, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toBuffer();

        await fs.writeFile(file.path, resizedImage);
        return file;
    } catch (error) {
        console.error('이미지 리사이징 실패:', error);
        throw createError(500, '이미지 처리에 실패했습니다.');
    }
};

module.exports = {
    upload,
    uploadToStorage,
    deleteFile,
    resizeImage,
    fileFilter,
    single: (fieldName) => {
        if (!fieldName) {
            throw new Error('필드 이름이 필요합니다.');
        }
        return upload.single(fieldName);
    },
    array: (fieldName, maxCount) => {
        if (!fieldName) {
            throw new Error('필드 이름이 필요합니다.');
        }
        return upload.array(fieldName, maxCount);
    },
    fields: (fields) => {
        if (!Array.isArray(fields)) {
            throw new Error('필드 설정이 올바르지 않습니다.');
        }
        return upload.fields(fields);
    }
};
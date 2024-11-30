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
        fileSize: 5 * 1024 * 1024, // 5MB
    }
});

// Firebase Storage에 파일 업로드
const uploadToStorage = async (file) => {
    try {
        if (!file) throw createError(400, '파일이 없습니다.');

        const filePath = file.path;
        const fileName = `${Date.now()}-${file.filename}`;
        const destination = `images/${fileName}`;

        await bucket.upload(filePath, {
            destination,
            metadata: {
                contentType: file.mimetype,
                metadata: {
                    originalname: file.originalname,
                    encoding: file.encoding,
                }
            }
        });

        // 임시 파일 삭제
        await fs.unlink(filePath);

        // 파일의 공개 URL 생성
        const fileRef = bucket.file(destination);
        const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '01-01-2100'
        });

        return url;
    } catch (error) {
        console.error('파일 업로드 실패:', error);
        throw createError(500, '파일 업로드에 실패했습니다.');
    }
};

// 파일 삭제
const deleteFile = async (fileUrl) => {
    try {
        const fileName = path.basename(fileUrl);
        const file = bucket.file(`images/${fileName}`);
        await file.delete();
        return true;
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        throw createError(500, '파일 삭제에 실패했습니다.');
    }
};

// 이미지 리사이징
const resizeImage = async (file, options = { width: 800, height: 800 }) => {
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
    // 단일 파일 업로드 미들웨어
    single: (fieldName) => upload.single(fieldName),
    // 다중 파일 업로드 미들웨어
    array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
    // 여러 필드의 파일 업로드 미들웨어
    fields: (fields) => upload.fields(fields)
};
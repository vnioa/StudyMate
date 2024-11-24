const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// 저장 경로 설정
const STORAGE_PATH = {
    LOCAL: 'uploads/',
    PROFILE: 'uploads/profiles/',
    BACKGROUND: 'uploads/backgrounds/',
    STUDY: 'uploads/study/',
    TEMP: 'uploads/temp/'
};

// 저장 경로가 없으면 생성
Object.values(STORAGE_PATH).forEach(path => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원하지 않는 파일 형식입니다.'), false);
    }
};

// 로컬 스토리지 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.uploadType || 'temp';
        const dest = STORAGE_PATH[type.toUpperCase()] || STORAGE_PATH.TEMP;
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// 파일 업로드 설정
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// 파일 삭제 함수
const deleteFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        throw error;
    }
};

// 임시 파일 정리 함수 (24시간 이상 된 파일 삭제)
const cleanupTempFiles = async () => {
    try {
        const files = await fs.promises.readdir(STORAGE_PATH.TEMP);
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(STORAGE_PATH.TEMP, file);
            const stats = await fs.promises.stat(filePath);
            if (now - stats.mtime.getTime() > ONE_DAY) {
                await deleteFile(filePath);
            }
        }
    } catch (error) {
        console.error('임시 파일 정리 실패:', error);
    }
};

// 주기적으로 임시 파일 정리 (매일 자정)
setInterval(cleanupTempFiles, 24 * 60 * 60 * 1000);

module.exports = {
    upload,
    deleteFile,
    STORAGE_PATH,
    cleanupTempFiles
};
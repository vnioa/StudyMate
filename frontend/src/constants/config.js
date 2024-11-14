// config.js
import crypto from 'crypto-js'

const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');

export default {
    apiTimeout: 10000,            // API 요청 타임아웃 시간 (ms)
    defaultPageSize: 20,          // 기본 페이지 사이즈
    maxFileSize: 5000000,         // 최대 파일 크기 (5MB)
    encryptionKey: 'your-encryption-key',  // 암호화 키
};

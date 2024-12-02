const dotenv = require('dotenv');
const assert = require('assert');

dotenv.config();

// Firebase와 MySQL 환경 변수 설정
const {
    PORT,
    HOST,
    BASE_URL,
    API_KEY,
    AUTH_DOMAIN,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE
} = process.env;

// 필수 환경 변수 확인
assert(PORT, 'PORT is required');
assert(HOST, 'HOST is required');
assert(MYSQL_HOST, 'MYSQL_HOST is required');
assert(MYSQL_USER, 'MYSQL_USER is required');
assert(MYSQL_DATABASE, 'MYSQL_DATABASE is required');

module.exports = {
    // MySQL 설정
    mysql: {
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
        dialect: "mysql",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },

    // Firebase 설정
    firebase: {
        port: PORT,
        host: HOST,
        url: BASE_URL,
        firebaseConfig: {
            apiKey: API_KEY,
            authDomain: AUTH_DOMAIN,
            projectId: PROJECT_ID,
            storageBucket: STORAGE_BUCKET,
            messagingSenderId: MESSAGING_SENDER_ID,
            appId: APP_ID
        }
    }
};
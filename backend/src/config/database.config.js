const dotenv = require('dotenv');
const assert = require('assert');

// 환경 변수 로드 시 오류 처리
try {
    const envResult = dotenv.config();
    if (envResult.error) {
        throw new Error('환경 변수 파일을 찾을 수 없습니다.');
    }
} catch (error) {
    console.error('환경 변수 로드 실패:', error.message);
    process.exit(1);
}

// 환경 변수 유효성 검사 함수
const validateEnvVariables = (requiredEnvVars) => {
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};

// 필수 환경 변수 목록
const REQUIRED_ENV_VARS = [
    'PORT',
    'HOST',
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_DATABASE'
];

// Firebase 관련 환경 변수 목록
const FIREBASE_ENV_VARS = [
    'API_KEY',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'APP_ID'
];

try {
    // 필수 환경 변수 검증
    validateEnvVariables(REQUIRED_ENV_VARS);
    validateEnvVariables(FIREBASE_ENV_VARS);

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

    // MySQL 설정 객체
    const mysqlConfig = {
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
        },
        // 추가 보안 및 성능 설정
        dialectOptions: {
            ssl: {
                rejectUnauthorized: true
            },
            connectTimeout: 60000
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false
    };

    // Firebase 설정 객체
    const firebaseConfig = {
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
    };

    // Object.freeze()를 사용하여 설정 객체를 불변으로 만듦
    module.exports = Object.freeze({
        mysql: mysqlConfig,
        firebase: firebaseConfig,
        // 환경 설정 getter 함수
        getDbConfig: () => mysqlConfig,
        getFirebaseConfig: () => firebaseConfig
    });

} catch (error) {
    console.error('설정 초기화 실패:', error.message);
    process.exit(1);
}
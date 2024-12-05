const mysql = require('mysql2');
const dotenv = require('dotenv');

// 환경 변수 로드 및 검증
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
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_PORT'
];

try {
    // 필수 환경 변수 검증
    validateEnvVariables(REQUIRED_ENV_VARS);

    // MySQL 연결 풀 생성
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: true
        } : false,
        connectTimeout: 60000,
        timezone: '+09:00',
        dateStrings: true,
        multipleStatements: false,
        typeCast: true,
        supportBigNumbers: true,
        bigNumberStrings: true,
        decimalNumbers: true
    }).promise();

    // 연결 풀 이벤트 핸들러
    pool.on('connection', () => {
        console.log('New connection established');
    });

    pool.on('error', (err) => {
        console.error('Database pool error:', err);
    });

    // 데이터베이스 유틸리티 함수들
    const dbUtils = {
        testConnection: async () => {
            try {
                await pool.query('SELECT 1');
                console.log('✅ Database connection successful.');
            } catch (error) {
                console.error('❌ Database connection failed:', error);
                throw error;
            }
        },

        query: async (query, params = []) => {
            try {
                const [results] = await pool.query(query, params);
                return results;
            } catch (error) {
                console.error('❌ Query execution error:', error);
                throw error;
            }
        },

        transaction: async (transactionCallback) => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                const result = await transactionCallback(connection);
                await connection.commit();
                return result;
            } catch (error) {
                await connection.rollback();
                console.error('❌ Transaction error:', error);
                throw error;
            } finally {
                connection.release();
            }
        },

        batchQuery: async (query, batchParams = []) => {
            try {
                const promises = batchParams.map((params) => pool.query(query, params));
                const results = await Promise.all(promises);
                return results.map(([result]) => result);
            } catch (error) {
                console.error('❌ Batch query execution error:', error);
                throw error;
            }
        },

        paginateQuery: async (query, params = [], page = 1, pageSize = 10) => {
            try {
                const offset = (page - 1) * pageSize;
                const paginatedQuery = `${query} LIMIT ?, ?`;
                const results = await dbUtils.query(paginatedQuery, [...params, offset, pageSize]);
                return results;
            } catch (error) {
                console.error('❌ Pagination query error:', error);
                throw error;
            }
        },

        closePool: async () => {
            try {
                await pool.end();
                console.log('Database pool closed successfully');
            } catch (error) {
                console.error('Error closing database pool:', error);
                throw error;
            }
        }
    };

    const initializeDatabase = async () => {
        try {
            await dbUtils.testConnection();
            console.log('✅ Database initialized and ready to use.');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    };

    // 설정 객체들을 불변으로 만들어 내보내기
    module.exports = Object.freeze({
        dbUtils,
        initializeDatabase,
        mysqlConfig: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            dialect: "mysql",
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            dialectOptions: {
                ssl: {
                    rejectUnauthorized: true
                },
                connectTimeout: 60000
            },
            logging: process.env.NODE_ENV === 'development' ? console.log : false
        }
    });

} catch (error) {
    console.error('설정 초기화 실패:', error.message);
    process.exit(1);
}
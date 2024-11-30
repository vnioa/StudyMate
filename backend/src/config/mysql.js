const mysql = require('mysql2/promise');

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'studymate',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// 데이터베이스 연결 테스트
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection successful');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

// 초기화 함수
const initialize = async () => {
    try {
        await testConnection();

        // 연결 풀 이벤트 리스너
        pool.on('connection', (connection) => {
            console.log('New connection established');
        });

        pool.on('error', (err) => {
            console.error('Database pool error:', err);
        });

    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};

// 트랜잭션 헬퍼 함수
const withTransaction = async (connection, callback) => {
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// 쿼리 실행 헬퍼 함수
const query = async (sql, params) => {
    const connection = await pool.getConnection();
    try {
        const [results] = await connection.query(sql, params);
        return results;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    initialize,
    withTransaction,
    query,
    getConnection: () => pool.getConnection()
};
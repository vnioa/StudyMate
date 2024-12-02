const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// 연결 테스트 함수
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL 연결 성공');
        connection.release();
    } catch (error) {
        console.error('MySQL 연결 실패:', error);
        process.exit(1);
    }
};

// 초기 연결 테스트 실행
testConnection();

// 트랜잭션 헬퍼 함수
const withTransaction = async (callback) => {
    const connection = await pool.getConnection();
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

module.exports = {
    pool,
    execute: (...params) => pool.execute(...params),
    query: (...params) => pool.query(...params),
    withTransaction
};
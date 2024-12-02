const mysql = require('mysql2');
require('dotenv').config();

// MySQL 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'studymate',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
}).promise();

/**
 * 데이터베이스 연결 테스트
 */
const testConnection = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Database connection successful.');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};

/**
 * 일반 쿼리 실행 헬퍼
 * @param {string} query - SQL 쿼리 문자열
 * @param {Array} params - SQL 쿼리 매개변수
 * @returns {Promise<any>} - 쿼리 결과
 */
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await pool.query(query, params);
        return results;
    } catch (error) {
        console.error('❌ Query execution error:', error);
        throw error;
    }
};

/**
 * 트랜잭션 헬퍼
 * @param {Function} transactionCallback - 트랜잭션에서 실행할 콜백 함수
 * @returns {Promise<any>} - 트랜잭션 결과
 */
const executeTransaction = async (transactionCallback) => {
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
};

/**
 * 배치 쿼리 실행
 * @param {string} query - SQL 쿼리 문자열
 * @param {Array<Array>} batchParams - 쿼리 매개변수 배열
 * @returns {Promise<Array>} - 각 쿼리의 결과
 */
const executeBatchQuery = async (query, batchParams = []) => {
    try {
        const promises = batchParams.map((params) => pool.query(query, params));
        const results = await Promise.all(promises);
        return results.map(([result]) => result);
    } catch (error) {
        console.error('❌ Batch query execution error:', error);
        throw error;
    }
};

/**
 * 페이지네이션 헬퍼
 * @param {string} query - SQL 쿼리 문자열
 * @param {Array} params - SQL 쿼리 매개변수
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} pageSize - 페이지 크기 (기본값: 10)
 * @returns {Promise<Array>} - 페이징된 결과
 */
const executePaginatedQuery = async (query, params = [], page = 1, pageSize = 10) => {
    try {
        const offset = (page - 1) * pageSize;
        const paginatedQuery = `${query} LIMIT ?, ?`;
        const results = await executeQuery(paginatedQuery, [...params, offset, pageSize]);
        return results;
    } catch (error) {
        console.error('❌ Pagination query error:', error);
        throw error;
    }
};

/**
 * 데이터베이스 초기화
 */
const initializeDatabase = async () => {
    try {
        await testConnection();
        console.log('✅ Database initialized and ready to use.');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
};

// 모듈화된 유틸리티 객체
const dbUtils = {
    testConnection,
    query: executeQuery,
    transaction: executeTransaction,
    batchQuery: executeBatchQuery,
    paginateQuery: executePaginatedQuery,
};

module.exports = { dbUtils, initializeDatabase };

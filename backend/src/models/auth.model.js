const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('../config/mysql');

const pool = mysql.createPool(config.db);

const AuthModel = {
    // 사용자 테이블 생성
    async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                birthdate DATE NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                profile_image VARCHAR(255),
                is_active BOOLEAN DEFAULT true,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await pool.query(query);
    },

    // 인증 코드 테이블 생성
    async createAuthCodeTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS auth_codes (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36),
                code VARCHAR(6) NOT NULL,
                type ENUM('id', 'password') NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `;
        await pool.query(query);
    },

    // 소셜 계정 테이블 생성
    async createSocialAccountTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS social_accounts (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                provider ENUM('google', 'kakao') NOT NULL,
                social_id VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                is_primary BOOLEAN DEFAULT false,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE KEY unique_provider_social_id (provider, social_id)
            )
        `;
        await pool.query(query);
    },

    // 리프레시 토큰 테이블 생성
    async createRefreshTokenTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `;
        await pool.query(query);
    },

    // 사용자 생성
    async createUser(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const query = `
            INSERT INTO users (id, username, password, name, email, birthdate, phone_number)
            VALUES (UUID(), ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [
            userData.username,
            hashedPassword,
            userData.name,
            userData.email,
            userData.birthdate,
            userData.phoneNumber
        ]);
        return result;
    },

    // 사용자 조회
    async findUserByUsername(username) {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    },

    // 이메일로 사용자 조회
    async findUserByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // 인증 코드 저장
    async saveAuthCode(userId, code, type) {
        const query = `
            INSERT INTO auth_codes (id, user_id, code, type, expires_at)
            VALUES (UUID(), ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))
        `;
        const [result] = await pool.query(query, [userId, code, type]);
        return result;
    },

    // 인증 코드 검증
    async verifyAuthCode(email, code, type) {
        const query = `
            SELECT ac.* FROM auth_codes ac
            JOIN users u ON ac.user_id = u.id
            WHERE u.email = ? AND ac.code = ? AND ac.type = ?
            AND ac.expires_at > NOW()
            ORDER BY ac.created_at DESC LIMIT 1
        `;
        const [rows] = await pool.query(query, [email, code, type]);
        return rows[0];
    },

    // 리프레시 토큰 저장
    async saveRefreshToken(userId, token, expiresIn) {
        const query = `
            INSERT INTO refresh_tokens (id, user_id, token, expires_at)
            VALUES (UUID(), ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
        `;
        const [result] = await pool.query(query, [userId, token, expiresIn]);
        return result;
    },

    // 리프레시 토큰 검증
    async verifyRefreshToken(token) {
        const query = `
            SELECT * FROM refresh_tokens
            WHERE token = ? AND expires_at > NOW()
        `;
        const [rows] = await pool.query(query, [token]);
        return rows[0];
    }
};

module.exports = AuthModel;
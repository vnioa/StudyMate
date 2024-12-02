const db = require('../../config/mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
    async register(userData) {
        const { username, password, email, name, phoneNumber, birthdate } = userData;
    
        // 이메일 또는 사용자 이름 중복 확인
        const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    
        if (existingUser.length > 0) {
            throw new Error('이미 존재하는 아이디나 이메일입니다.');
        }
    
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const [result] = await db.execute(
            'INSERT INTO users (username, password, email, name, phone_number, birthdate) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, email, name, phoneNumber, birthdate]
        );
    
        return {
            success: true,
            message: '회원가입이 완료되었습니다.'
        };
    }

    async login(credentials) {
        const { username, password } = credentials;
    
        const [user] = await db.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
    
        if (user.length === 0) {
            throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
        }
    
        if (!(await bcrypt.compare(password, user[0].password))) {
            throw new Error('아이디 또는 비밀번호가 잘못되었습니다.');
        }
    
        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
        await db.execute(
            'INSERT INTO sessions (user_id, token) VALUES (?, ?)',
            [user[0].id, token]
        );
    
        return {
            success: true,
            token,
            user: {
                id: user[0].id,
                username: user[0].username,
                name: user[0].name
            }
        };
    }

    async logout(userId, token) {
        await db.execute(
            'DELETE FROM sessions WHERE user_id = ? AND token = ?',
            [userId, token]
        );
    }

    async deleteAccount(userId) {
        await db.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    }
    async checkUsername(username) {
        const [existingUser] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            throw new Error('이미 존재하는 사용자 이름입니다.');
        }
        return { success: true, message: '사용자 이름을 사용할 수 있습니다.' };
    }
    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return true;  // 유효한 토큰인 경우
        } catch (error) {
            return false;  // 유효하지 않은 토큰인 경우
        }
    }
}

module.exports = new UserService();
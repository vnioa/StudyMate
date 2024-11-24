const db = require('../../config/mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
    async register(userData) {
        const { username, password, email, name, phoneNumber, birthdate } = userData;

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

        if (user.length === 0 || !(await bcrypt.compare(password, user[0].password))) {
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
}

module.exports = new UserService();
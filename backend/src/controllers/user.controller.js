const db = require('../config/mysql');
const createError = require('http-errors');
const { uploadToStorage } = require('../utils/fileUpload');

const UserController = {
    // 이름 유효성 검사
    validateName: async (req, res, next) => {
        try {
            const { name } = req.body;
            if (!name || name.length < 2) {
                return res.json({
                    isValid: false,
                    message: '이름은 2자 이상이어야 합니다.'
                });
            }
            res.json({ isValid: true });
        } catch (err) {
            next(err);
        }
    },

    // 사용자 프로필 조회
    getProfile: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [profile] = await connection.query(
                'SELECT name, email, profile_image FROM users WHERE id = ?',
                [req.user.id]
            );

            if (!profile.length) {
                throw createError(404, '사용자를 찾을 수 없습니다.');
            }

            res.json(profile[0]);
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 프로필 이미지 업로드
    uploadImage: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { type } = req.params;
            if (!req.file) {
                throw createError(400, '이미지 파일이 없습니다.');
            }

            const imageUrl = await uploadToStorage(req.file);
            const field = type === 'background' ? 'background_image' : 'profile_image';

            await connection.query(
                `UPDATE users SET ${field} = ? WHERE id = ?`,
                [imageUrl, req.user.id]
            );

            res.json({
                success: true,
                imageUrl
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 사용자 정보 조회
    getUserInfo: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [user] = await connection.query(
                'SELECT name, phone, birthdate, id, email FROM users WHERE id = ?',
                [req.user.id]
            );

            if (!user.length) {
                throw createError(404, '사용자를 찾을 수 없습니다.');
            }

            res.json(user[0]);
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 사용자 정보 수정
    updateUserInfo: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { name, phone, birthdate, password } = req.body;
            const updates = [];
            const values = [];

            if (name) {
                updates.push('name = ?');
                values.push(name);
            }
            if (phone) {
                updates.push('phone = ?');
                values.push(phone);
            }
            if (birthdate) {
                updates.push('birthdate = ?');
                values.push(birthdate);
            }
            if (password) {
                updates.push('password = ?');
                values.push(await bcrypt.hash(password, 10));
            }

            if (updates.length === 0) {
                throw createError(400, '수정할 정보가 없습니다.');
            }

            values.push(req.user.id);
            await connection.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 프로필 공개 설정 변경
    updatePrivacy: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { isPublic } = req.body;
            await connection.query(
                'UPDATE users SET is_public = ? WHERE id = ?',
                [isPublic, req.user.id]
            );
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 연동 계정 관련 메서드들
    getSocialAccounts: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [accounts] = await connection.query(
                'SELECT * FROM social_accounts WHERE user_id = ?',
                [req.user.id]
            );
            res.json({ accounts });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    disconnectAccount: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { accountId } = req.params;
            await connection.query(
                'DELETE FROM social_accounts WHERE id = ? AND user_id = ?',
                [accountId, req.user.id]
            );
            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 비밀번호 변경
    changePassword: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { currentPassword, newPassword } = req.body;
            const [user] = await connection.query(
                'SELECT password FROM users WHERE id = ?',
                [req.user.id]
            );

            if (!user.length || !(await bcrypt.compare(currentPassword, user[0].password))) {
                throw createError(400, '현재 비밀번호가 일치하지 않습니다.');
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await connection.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, req.user.id]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = UserController;
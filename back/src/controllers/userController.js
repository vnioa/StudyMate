const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 유틸리티 함수
const utils = {
    async executeQuery(query, params) {
        try {
            const [results] = await db.execute(query, params);
            return results;
        } catch (error) {
            console.error('Query execution error:', error);
            throw new Error('데이터베이스 쿼리 실행 실패');
        }
    },

    async executeTransaction(callback) {
        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    validateName(name) {
        return name && name.length >= 2 && name.length <= 50;
    },

    validatePhone(phone) {
        return /^[0-9]{10,11}$/.test(phone);
    },

    validatePassword(password) {
        return password && password.length >= 8 && password.length <= 255;
    }
};

const userController = {
    // 이름 유효성 검사
    validateName: async (req, res) => {
        try {
            const {name} = req.body;

            if (!utils.validateName(name)) {
                return res.status(400).json({
                    success: false,
                    message: '이름은 2-50자 사이여야 합니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '유효한 이름입니다.'
            });
        } catch (error) {
            console.error('이름 유효성 검사 오류:', error);
            res.status(500).json({
                success: false,
                message: '이름 유효성 검사에 실패했습니다.'
            });
        }
    },

    // 이름 업데이트
    updateName: async (req, res) => {
        try {
            const userId = req.user.id;
            const {name} = req.body;

            if (!utils.validateName(name)) {
                return res.status(400).json({
                    success: false,
                    message: '이름은 2-50자 사이여야 합니다.'
                });
            }

            await utils.executeQuery(`
                UPDATE users
                SET name      = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `, [name, userId]);

            res.status(200).json({
                success: true,
                message: '이름이 성공적으로 업데이트되었습니다.',
                data: {name}
            });
        } catch (error) {
            console.error('이름 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '이름 업데이트에 실패했습니다.'
            });
        }
    },

    // 프로필 조회
    getProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            const [profile] = await utils.executeQuery(`
                SELECT id,
                       username,
                       email,
                       name,
                       phone,
                       birthdate,
                       profileImage,
                       backgroundImage,
                       bio,
                       isPublic,
                       status,
                       lastLoginAt,
                       role
                FROM users
                WHERE id = ?
                  AND deletedAt IS NULL
            `, [userId]);

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: '프로필을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('프로필 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '프로필 조회에 실패했습니다.'
            });
        }
    },

    // 프로필 업데이트
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const {bio, phone, birthdate} = req.body;

            await utils.executeQuery(`
                UPDATE users
                SET bio       = ?,
                    phone     = ?,
                    birthdate = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `, [bio, phone, birthdate, userId]);

            res.status(200).json({
                success: true,
                message: '프로필이 성공적으로 업데이트되었습니다.',
                data: {bio, phone, birthdate}
            });
        } catch (error) {
            console.error('프로필 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '프로필 업데이트에 실패했습니다.'
            });
        }
    },

    // 프로필 공개 설정 업데이트
    updatePrivacy: async (req, res) => {
        try {
            const userId = req.user.id;
            const {isPublic} = req.body;

            await utils.executeQuery(`
                UPDATE users
                SET isPublic  = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `, [isPublic, userId]);

            res.status(200).json({
                success: true,
                message: '프로필 공개 설정이 업데이트되었습니다.',
                data: {isPublic}
            });
        } catch (error) {
            console.error('프로필 공개 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '프로필 공개 설정 업데이트에 실패했습니다.'
            });
        }
    },

    // 이미지 업로드
    uploadImage: async (req, res) => {
        try {
            const userId = req.user.id;
            const {type} = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '이미지 파일이 필요합니다.'
                });
            }

            const column = type === 'profile' ? 'profileImage' : 'backgroundImage';
            const imageUrl = `uploads/${type}/${userId}/${file.filename}`;

            await utils.executeQuery(`
                UPDATE users
                SET ${column} = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `, [imageUrl, userId]);

            res.status(200).json({
                success: true,
                message: '이미지가 성공적으로 업로드되었습니다.',
                data: {imageUrl}
            });
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '이미지 업로드에 실패했습니다.'
            });
        }
    },

    // 사용자 정보 조회
    getUserInfo: async (req, res) => {
        try {
            const userId = req.user.id;

            const [userInfo] = await utils.executeQuery(`
                SELECT u.*, COUNT(usa.id) as socialAccountsCount
                FROM users u
                         LEFT JOIN user_social_accounts usa ON u.id = usa.memberId
                WHERE u.id = ?
                GROUP BY u.id
            `, [userId]);

            res.status(200).json({
                success: true,
                data: userInfo
            });
        } catch (error) {
            console.error('사용자 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '사용자 정보 조회에 실패했습니다.'
            });
        }
    },

    // 사용자 정보 업데이트
    updateUserInfo: async (req, res) => {
        try {
            const userId = req.user.id;
            const {username, email, phone} = req.body;

            await utils.executeQuery(`
                UPDATE users
                SET username  = ?,
                    email     = ?,
                    phone     = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `, [username, email, phone, userId]);

            res.status(200).json({
                success: true,
                message: '사용자 정보가 업데이트되었습니다.',
                data: {username, email, phone}
            });
        } catch (error) {
            console.error('사용자 정보 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '사용자 정보 업데이트에 실패했습니다.'
            });
        }
    },

    // 전화번호 유효성 검사
    validatePhone: async (req, res) => {
        try {
            const {phone} = req.body;

            if (!utils.validatePhone(phone)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 전화번호 형식입니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '유효한 전화번호입니다.'
            });
        } catch (error) {
            console.error('전화번호 유효성 검사 오류:', error);
            res.status(500).json({
                success: false,
                message: '전화번호 유효성 검사에 실패했습니다.'
            });
        }
    },

    // 비밀번호 유효성 검사
    validatePassword: async (req, res) => {
        try {
            const {password} = req.body;

            if (!utils.validatePassword(password)) {
                return res.status(400).json({
                    success: false,
                    message: '비밀번호는 8자 이상이어야 합니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '유효한 비밀번호입니다.'
            });
        } catch (error) {
            console.error('비밀번호 유효성 검사 오류:', error);
            res.status(500).json({
                success: false,
                message: '비밀번호 유효성 검사에 실패했습니다.'
            });
        }
    },

    // 계정 연결 해제
    disconnectAccount: async (req, res) => {
        try {
            const userId = req.user.id;
            const {accountId} = req.params;

            await utils.executeQuery(`
                UPDATE user_social_accounts
                SET deletedAt = NOW()
                WHERE id = ?
                  AND memberId = ?
            `, [accountId, userId]);

            res.status(200).json({
                success: true,
                message: '계정이 연결 해제되었습니다.'
            });
        } catch (error) {
            console.error('계정 연결 해제 오류:', error);
            res.status(500).json({
                success: false,
                message: '계정 연결 해제에 실패했습니다.'
            });
        }
    },

    // 비밀번호 변경
    changePassword: async (req, res) => {
        try {
            const userId = req.user.id;
            const {currentPassword, newPassword} = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [user] = await connection.execute(
                    'SELECT password FROM users WHERE id = ?',
                    [userId]
                );

                const isValidPassword = await bcrypt.compare(currentPassword, user.password);
                if (!isValidPassword) {
                    throw new Error('현재 비밀번호가 일치하지 않습니다.');
                }

                const hashedPassword = await bcrypt.hash(newPassword, 12);
                await connection.execute(`
                    UPDATE users
                    SET password           = ?,
                        lastPasswordChange = NOW(),
                        updatedAt          = NOW()
                    WHERE id = ?
                `, [hashedPassword, userId]);
            });

            res.status(200).json({
                success: true,
                message: '비밀번호가 성공적으로 변경되었습니다.'
            });
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            res.status(500).json({
                success: false,
                message: '비밀번호 변경에 실패했습니다.'
            });
        }
    },

    // 소셜 계정 목록 조회
    getSocialAccounts: async (req, res) => {
        try {
            const userId = req.user.id;

            const accounts = await utils.executeQuery(`
                SELECT id, provider, socialId, email, isPrimary
                FROM user_social_accounts
                WHERE memberId = ?
                  AND deletedAt IS NULL
            `, [userId]);

            res.status(200).json({
                success: true,
                data: accounts
            });
        } catch (error) {
            console.error('소셜 계정 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '소셜 계정 목록 조회에 실패했습니다.'
            });
        }
    },

    // 주 계정 조회
    getPrimaryAccount: async (req, res) => {
        try {
            const userId = req.user.id;

            const [primaryAccount] = await utils.executeQuery(`
                SELECT id, provider, socialId, email
                FROM user_social_accounts
                WHERE memberId = ?
                  AND isPrimary = true
                  AND deletedAt IS NULL
            `, [userId]);

            res.status(200).json({
                success: true,
                data: primaryAccount
            });
        } catch (error) {
            console.error('주 계정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '주 계정 조회에 실패했습니다.'
            });
        }
    },

    // 주 계정 설정
    setPrimaryAccount: async (req, res) => {
        try {
            const userId = req.user.id;
            const {accountId} = req.params;

            await utils.executeTransaction(async (connection) => {
                // 먼저 모든 계정의 주 계정 상태를 false로 설정
                await connection.execute(
                    'UPDATE user_social_accounts SET isPrimary = false WHERE memberId = ?',
                    [userId]
                );

                // 선택된 계정을 주 계정으로 설정
                await connection.execute(
                    'UPDATE user_social_accounts SET isPrimary = true WHERE id = ? AND memberId = ?',
                    [accountId, userId]
                );
            });

            res.status(200).json({
                success: true,
                message: '주 계정이 설정되었습니다.'
            });
        } catch (error) {
            console.error('주 계정 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '주 계정 설정에 실패했습니다.'
            });
        }
    },

    // 소셜 계정 연결 해제
    disconnectSocialAccount: async (req, res) => {
        try {
            const userId = req.user.id;
            const {accountId} = req.params;

            await utils.executeTransaction(async (connection) => {
                const [account] = await connection.execute(
                    'SELECT * FROM user_social_accounts WHERE id = ? AND memberId = ?',
                    [accountId, userId]
                );

                if (!account) {
                    throw new Error('계정을 찾을 수 없습니다.');
                }

                if (account.isPrimary) {
                    throw new Error('주 계정은 연결 해제할 수 없습니다.');
                }

                await connection.execute(
                    'UPDATE user_social_accounts SET deletedAt = NOW() WHERE id = ?',
                    [accountId]
                );
            });

            res.status(200).json({
                success: true,
                message: '소셜 계정이 연결 해제되었습니다.'
            });
        } catch (error) {
            console.error('소셜 계정 연결 해제 오류:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = userController;
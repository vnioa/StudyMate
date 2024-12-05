const { dbUtils } = require('../config/database.config');
const bcrypt = require('bcrypt');

const userService = {
    // 이름 유효성 검사
    async validateName(name) {
        if (!name || name.length < 2 || name.length > 50) {
            throw new Error('이름은 2-50자 사이여야 합니다.');
        }
        return true;
    },

    // 이름 업데이트
    async updateName(userId, name) {
        try {
            const query = `
                UPDATE users 
                SET name = ?, updatedAt = NOW()
                WHERE id = ?
            `;
            await dbUtils.query(query, [name, userId]);
            return { success: true, name };
        } catch (error) {
            throw new Error('이름 업데이트 실패: ' + error.message);
        }
    },

    // 프로필 조회
    async getProfile(userId) {
        try {
            const query = `
                SELECT id, username, email, name, phone, birthdate,
                       profileImage, backgroundImage, bio, isPublic,
                       status, lastLoginAt, role
                FROM users
                WHERE id = ? AND deletedAt IS NULL
            `;
            const [profile] = await dbUtils.query(query, [userId]);
            return profile;
        } catch (error) {
            throw new Error('프로필 조회 실패: ' + error.message);
        }
    },

    // 프로필 업데이트
    async updateProfile(userId, profileData) {
        try {
            const query = `
                UPDATE users
                SET bio = ?,
                    phone = ?,
                    birthdate = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `;
            await dbUtils.query(query, [
                profileData.bio,
                profileData.phone,
                profileData.birthdate,
                userId
            ]);
            return { success: true, ...profileData };
        } catch (error) {
            throw new Error('프로필 업데이트 실패: ' + error.message);
        }
    },

    // 프로필 공개 설정 업데이트
    async updatePrivacy(userId, isPublic) {
        try {
            const query = `
                UPDATE users
                SET isPublic = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `;
            await dbUtils.query(query, [isPublic, userId]);
            return { success: true, isPublic };
        } catch (error) {
            throw new Error('프로필 공개 설정 업데이트 실패: ' + error.message);
        }
    },

    // 이미지 업로드
    async uploadImage(userId, type, file) {
        try {
            const column = type === 'profile' ? 'profileImage' : 'backgroundImage';
            const imageUrl = `uploads/${type}/${userId}/${file.filename}`;

            const query = `
                UPDATE users
                SET ${column} = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `;
            await dbUtils.query(query, [imageUrl, userId]);
            return { success: true, imageUrl };
        } catch (error) {
            throw new Error('이미지 업로드 실패: ' + error.message);
        }
    },

    // 사용자 정보 조회
    async getUserInfo(userId) {
        try {
            const query = `
                SELECT u.*, 
                       COUNT(usa.id) as socialAccountsCount
                FROM users u
                LEFT JOIN user_social_accounts usa ON u.id = usa.memberId
                WHERE u.id = ?
                GROUP BY u.id
            `;
            const [userInfo] = await dbUtils.query(query, [userId]);
            return userInfo;
        } catch (error) {
            throw new Error('사용자 정보 조회 실패: ' + error.message);
        }
    },

    // 사용자 정보 업데이트
    async updateUserInfo(userId, userInfo) {
        try {
            const query = `
                UPDATE users
                SET username = ?,
                    email = ?,
                    phone = ?,
                    updatedAt = NOW()
                WHERE id = ?
            `;
            await dbUtils.query(query, [
                userInfo.username,
                userInfo.email,
                userInfo.phone,
                userId
            ]);
            return { success: true, ...userInfo };
        } catch (error) {
            throw new Error('사용자 정보 업데이트 실패: ' + error.message);
        }
    },

    // 전화번호 유효성 검사
    async validatePhone(phone) {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            throw new Error('유효하지 않은 전화번호 형식입니다.');
        }
        return true;
    },

    // 비밀번호 유효성 검사
    async validatePassword(password) {
        if (!password || password.length < 8 || password.length > 255) {
            throw new Error('비밀번호는 8자 이상이어야 합니다.');
        }
        return true;
    },

    // 계정 연결 해제
    async disconnectAccount(userId, accountId) {
        try {
            const query = `
                UPDATE user_social_accounts
                SET deletedAt = NOW()
                WHERE id = ? AND memberId = ?
            `;
            await dbUtils.query(query, [accountId, userId]);
            return { success: true };
        } catch (error) {
            throw new Error('계정 연결 해제 실패: ' + error.message);
        }
    },

    // 비밀번호 변경
    async changePassword(userId, currentPassword, newPassword) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [user] = await connection.query(
                    'SELECT password FROM users WHERE id = ?',
                    [userId]
                );

                const isValidPassword = await bcrypt.compare(currentPassword, user.password);
                if (!isValidPassword) {
                    throw new Error('현재 비밀번호가 일치하지 않습니다.');
                }

                const hashedPassword = await bcrypt.hash(newPassword, 12);
                await connection.query(`
                    UPDATE users
                    SET password = ?,
                        lastPasswordChange = NOW(),
                        updatedAt = NOW()
                    WHERE id = ?
                `, [hashedPassword, userId]);

                return { success: true };
            } catch (error) {
                throw new Error('비밀번호 변경 실패: ' + error.message);
            }
        });
    },

    // 소셜 계정 목록 조회
    async getSocialAccounts(userId) {
        try {
            const query = `
            SELECT id, provider, socialId, email, isPrimary
            FROM user_social_accounts
            WHERE memberId = ? AND deletedAt IS NULL
        `;
            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('소셜 계정 목록 조회 실패: ' + error.message);
        }
    },

// 주 계정 조회
    async getPrimaryAccount(userId) {
        try {
            const query = `
            SELECT id, provider, socialId, email
            FROM user_social_accounts
            WHERE memberId = ? AND isPrimary = true AND deletedAt IS NULL
        `;
            const [primaryAccount] = await dbUtils.query(query, [userId]);
            return primaryAccount;
        } catch (error) {
            throw new Error('주 계정 조회 실패: ' + error.message);
        }
    },

// 주 계정 설정
    async setPrimaryAccount(userId, accountId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(
                    'UPDATE user_social_accounts SET isPrimary = false WHERE memberId = ?',
                    [userId]
                );
                await connection.query(
                    'UPDATE user_social_accounts SET isPrimary = true WHERE id = ? AND memberId = ?',
                    [accountId, userId]
                );
                return { success: true };
            } catch (error) {
                throw new Error('주 계정 설정 실패: ' + error.message);
            }
        });
    },

// 소셜 계정 연결 해제
    async disconnectSocialAccount(userId, accountId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [account] = await connection.query(
                    'SELECT * FROM user_social_accounts WHERE id = ? AND memberId = ?',
                    [accountId, userId]
                );

                if (!account) {
                    throw new Error('계정을 찾을 수 없습니다.');
                }

                if (account.isPrimary) {
                    throw new Error('주 계정은 연결 해제할 수 없습니다.');
                }

                await connection.query(
                    'UPDATE user_social_accounts SET deletedAt = NOW() WHERE id = ?',
                    [accountId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('소셜 계정 연결 해제 실패: ' + error.message);
            }
        });
    }
};

module.exports = userService;
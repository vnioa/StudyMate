const { User, UserSocialAccount, UserPrivacySettings } = require('../models');
const { dbUtils } = require('../config/db');
const { uploadImage, deleteImage } = require('../utils/fileUpload');
const bcrypt = require('bcrypt');

const userService = {
    // 이름 유효성 검사
    async validateName(name) {
        try {
            if (!name || name.length < 2 || name.length > 50) {
                throw new Error('이름은 2-50자 사이여야 합니다');
            }

            const exists = await dbUtils.query(
                'SELECT id FROM users WHERE name = ?',
                [name]
            );

            return {
                isValid: exists.length === 0,
                message: exists.length > 0 ? '이미 사용 중인 이름입니다' : '사용 가능한 이름입니다'
            };
        } catch (error) {
            throw new Error('이름 검증 실패: ' + error.message);
        }
    },

    // 이름 변경
    async updateName(userId, name) {
        try {
            const result = await dbUtils.query(
                'UPDATE users SET name = ? WHERE id = ?',
                [name, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('사용자를 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('이름 변경 실패: ' + error.message);
        }
    },

    // 사용자 프로필 조회
    async getProfile(userId) {
        try {
            const query = `
                SELECT u.*, ups.profileVisibility, ups.activityVisibility
                FROM users u
                LEFT JOIN user_privacy_settings ups ON u.id = ups.userId
                WHERE u.id = ?
            `;
            const [profile] = await dbUtils.query(query, [userId]);

            if (!profile) {
                throw new Error('프로필을 찾을 수 없습니다');
            }

            return { profile };
        } catch (error) {
            throw new Error('프로필 조회 실패: ' + error.message);
        }
    },

    // 프로필 이미지 업로드
    async uploadImage(userId, type, file) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [user] = await connection.query(
                    'SELECT profileImage, backgroundImage FROM users WHERE id = ?',
                    [userId]
                );

                if (!user) {
                    throw new Error('사용자를 찾을 수 없습니다');
                }

                const imageUrl = await uploadImage(file);
                const column = type === 'profile' ? 'profileImage' : 'backgroundImage';
                const oldImage = user[column];

                await connection.query(
                    `UPDATE users SET ${column} = ? WHERE id = ?`,
                    [imageUrl, userId]
                );

                if (oldImage) {
                    await deleteImage(oldImage);
                }

                return { imageUrl };
            } catch (error) {
                throw new Error('이미지 업로드 실패: ' + error.message);
            }
        });
    },

    // 사용자 정보 조회
    async getUserInfo(userId) {
        try {
            const query = `
                SELECT u.*, usa.provider, usa.isPrimary
                FROM users u
                LEFT JOIN user_social_accounts usa ON u.id = usa.userId
                WHERE u.id = ?
            `;
            const [user] = await dbUtils.query(query, [userId]);

            if (!user) {
                throw new Error('사용자를 찾을 수 없습니다');
            }

            return { user };
        } catch (error) {
            throw new Error('사용자 정보 조회 실패: ' + error.message);
        }
    },

    // 사용자 정보 수정
    async updateUserInfo(userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const { name, phone, birthdate, password } = data;

                if (password) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    data.password = hashedPassword;
                }

                await connection.query(`
                    UPDATE users
                    SET name = ?,
                        phone = ?,
                        birthdate = ?,
                        password = COALESCE(?, password)
                    WHERE id = ?
                `, [name, phone, birthdate, data.password, userId]);

                return { success: true };
            } catch (error) {
                throw new Error('사용자 정보 수정 실패: ' + error.message);
            }
        });
    },

    // 전화번호 유효성 검사
    async validatePhone(phone) {
        try {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(phone)) {
                throw new Error('유효하지 않은 전화번호 형식입니다');
            }

            const exists = await dbUtils.query(
                'SELECT id FROM users WHERE phone = ?',
                [phone]
            );

            return {
                isValid: exists.length === 0,
                message: exists.length > 0 ? '이미 등록된 전화번호입니다' : '사용 가능한 전화번호입니다'
            };
        } catch (error) {
            throw new Error('전화번호 검증 실패: ' + error.message);
        }
    },

    // 비밀번호 유효성 검사
    async validatePassword(password) {
        try {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            const isValid = passwordRegex.test(password);

            return {
                isValid,
                message: isValid ? '사용 가능한 비밀번호입니다' : '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다'
            };
        } catch (error) {
            throw new Error('비밀번호 검증 실패: ' + error.message);
        }
    },

    // 프로필 정보 업데이트
    async updateProfile(userId, data) {
        try {
            await dbUtils.query(`
                UPDATE users
                SET backgroundImage = ?,
                    profileImage = ?,
                    name = ?,
                    bio = ?
                WHERE id = ?
            `, [
                data.backgroundImage,
                data.profileImage,
                data.name,
                data.bio,
                userId
            ]);

            return { success: true };
        } catch (error) {
            throw new Error('프로필 정보 업데이트 실패: ' + error.message);
        }
    },

    // 프로필 공개 설정 변경
    async updatePrivacy(userId, data) {
        try {
            await dbUtils.query(
                'UPDATE users SET isPublic = ? WHERE id = ?',
                [data.isPublic, userId]
            );

            return { success: true };
        } catch (error) {
            throw new Error('프로필 공개 설정 변경 실패: ' + error.message);
        }
    },

    // 연동 계정 해제
    async disconnectAccount(userId, accountId) {
        try {
            const result = await dbUtils.query(
                'DELETE FROM user_social_accounts WHERE id = ? AND userId = ?',
                [accountId, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('계정을 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('계정 연동 해제 실패: ' + error.message);
        }
    },

    // 비밀번호 변경
    async changePassword(userId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [user] = await connection.query(
                    'SELECT password FROM users WHERE id = ?',
                    [userId]
                );

                const isValid = await bcrypt.compare(data.currentPassword, user.password);
                if (!isValid) {
                    throw new Error('현재 비밀번호가 일치하지 않습니다');
                }

                const hashedPassword = await bcrypt.hash(data.newPassword, 10);
                await connection.query(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [hashedPassword, userId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('비밀번호 변경 실패: ' + error.message);
            }
        });
    },

    // 소셜 계정 목록 조회
    async getSocialAccounts(userId) {
        try {
            const accounts = await dbUtils.query(
                'SELECT * FROM user_social_accounts WHERE userId = ?',
                [userId]
            );

            return { accounts };
        } catch (error) {
            throw new Error('소셜 계정 목록 조회 실패: ' + error.message);
        }
    },

    // 주 계정 조회
    async getPrimaryAccount(userId) {
        try {
            const [account] = await dbUtils.query(
                'SELECT * FROM user_social_accounts WHERE userId = ? AND isPrimary = true',
                [userId]
            );

            return { account };
        } catch (error) {
            throw new Error('주 계정 조회 실패: ' + error.message);
        }
    },

    // 주 계정 설정
    async setPrimaryAccount(userId, accountId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(
                    'UPDATE user_social_accounts SET isPrimary = false WHERE userId = ?',
                    [userId]
                );

                await connection.query(
                    'UPDATE user_social_accounts SET isPrimary = true WHERE id = ? AND userId = ?',
                    [accountId, userId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('주 계정 설정 실패: ' + error.message);
            }
        });
    },

    // 소셜 계정 연동 해제
    async disconnectSocialAccount(userId, accountId) {
        try {
            const result = await dbUtils.query(
                'DELETE FROM user_social_accounts WHERE id = ? AND userId = ? AND isPrimary = false',
                [accountId, userId]
            );

            if (result.affectedRows === 0) {
                throw new Error('주 계정은 연동 해제할 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('소셜 계정 연동 해제 실패: ' + error.message);
        }
    }
};

module.exports = userService;
const { dbUtils } = require('../config/db');

const profileService = {
    // 프로필 조회
    async getProfile(userId) {
        try {
            const query = `
                SELECT p.*, a.username, a.name, a.email
                FROM profiles p
                JOIN auth a ON p.memberId = a.id
                WHERE p.memberId = ?
            `;

            const [profile] = await dbUtils.query(query, [userId]);
            if (!profile) {
                throw new Error('프로필을 찾을 수 없습니다.');
            }

            return profile;
        } catch (error) {
            throw new Error('프로필 조회 실패: ' + error.message);
        }
    },

    // 프로필 수정
    async updateProfile(userId, updateData) {
        try {
            const query = `
                UPDATE profiles
                SET nickname = ?,
                    bio = ?,
                    updatedAt = NOW()
                WHERE memberId = ?
            `;

            const result = await dbUtils.query(query, [
                updateData.nickname,
                updateData.bio,
                userId
            ]);

            if (result.affectedRows === 0) {
                throw new Error('프로필을 찾을 수 없습니다.');
            }

            return await this.getProfile(userId);
        } catch (error) {
            throw new Error('프로필 수정 실패: ' + error.message);
        }
    },

    // 상태 메시지 업데이트
    async updateStatus(userId, message) {
        try {
            const query = `
                UPDATE profiles
                SET statusMessage = ?,
                    updatedAt = NOW()
                WHERE memberId = ?
            `;

            const result = await dbUtils.query(query, [message, userId]);

            if (result.affectedRows === 0) {
                throw new Error('프로필을 찾을 수 없습니다.');
            }

            return await this.getProfile(userId);
        } catch (error) {
            throw new Error('상태 메시지 업데이트 실패: ' + error.message);
        }
    },

    // 프로필 이미지 업로드
    async uploadProfileImage(userId, image) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const imageUrl = `uploads/profiles/${userId}/${image.filename}`;

                const query = `
                    UPDATE profiles
                    SET profileImage = ?,
                        updatedAt = NOW()
                    WHERE memberId = ?
                `;

                await connection.query(query, [imageUrl, userId]);
                return await this.getProfile(userId);
            } catch (error) {
                throw new Error('프로필 이미지 업로드 실패: ' + error.message);
            }
        });
    },

    // 배경 이미지 업로드
    async uploadBackgroundImage(userId, image) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const imageUrl = `uploads/backgrounds/${userId}/${image.filename}`;

                const query = `
                    UPDATE profiles
                    SET backgroundImage = ?,
                        updatedAt = NOW()
                    WHERE memberId = ?
                `;

                await connection.query(query, [imageUrl, userId]);
                return await this.getProfile(userId);
            } catch (error) {
                throw new Error('배경 이미지 업로드 실패: ' + error.message);
            }
        });
    },

    // 활동 상태 업데이트
    async updateActivityStatus(userId, status) {
        try {
            const query = `
                UPDATE profiles
                SET activeStatus = ?,
                    lastActive = NOW(),
                    updatedAt = NOW()
                WHERE memberId = ?
            `;

            const result = await dbUtils.query(query, [status, userId]);

            if (result.affectedRows === 0) {
                throw new Error('프로필을 찾을 수 없습니다.');
            }

            return await this.getProfile(userId);
        } catch (error) {
            throw new Error('활동 상태 업데이트 실패: ' + error.message);
        }
    },

    // 프로필 공개 범위 설정
    async updateVisibility(userId, visibility) {
        try {
            const query = `
                UPDATE profiles
                SET visibility = ?,
                    updatedAt = NOW()
                WHERE memberId = ?
            `;

            const result = await dbUtils.query(query, [visibility, userId]);

            if (result.affectedRows === 0) {
                throw new Error('프로필을 찾을 수 없습니다.');
            }

            return await this.getProfile(userId);
        } catch (error) {
            throw new Error('프로필 공개 범위 설정 실패: ' + error.message);
        }
    }
};

module.exports = profileService;
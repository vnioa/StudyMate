const { Profile, User } = require('../models');
const { dbUtils } = require('../config/db');

const profileService = {
    // 내 프로필 조회
    async getMyProfile(userId) {
        try {
            const query = `
                SELECT p.*, u.email, u.name
                FROM profiles p
                JOIN users u ON p.userId = u.id
                WHERE p.userId = ?
            `;
            const [profile] = await dbUtils.query(query, [userId]);

            if (!profile) {
                throw new Error('프로필을 찾을 수 없습니다');
            }

            // 마지막 활동 시간 업데이트
            await dbUtils.query(`
                UPDATE profiles 
                SET lastActive = NOW()
                WHERE userId = ?
            `, [userId]);

            return { profile };
        } catch (error) {
            throw new Error('프로필 조회 실패: ' + error.message);
        }
    },

    // 상태 메시지 업데이트
    async updateStatus(userId, message) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 프로필 존재 확인
                const [profile] = await connection.query(
                    'SELECT id FROM profiles WHERE userId = ?',
                    [userId]
                );

                if (!profile) {
                    throw new Error('프로필을 찾을 수 없습니다');
                }

                // 상태 메시지 업데이트
                await connection.query(`
                    UPDATE profiles 
                    SET statusMessage = ?,
                        lastActive = NOW()
                    WHERE userId = ?
                `, [message, userId]);

                return {
                    success: true,
                    message: '상태 메시지가 업데이트되었습니다'
                };
            } catch (error) {
                throw new Error('상태 메시지 업데이트 실패: ' + error.message);
            }
        });
    },

    // 프로필 이미지 업데이트
    async updateProfileImage(userId, imageUrl) {
        try {
            // 기존 이미지 조회
            const [profile] = await dbUtils.query(
                'SELECT profileImage FROM profiles WHERE userId = ?',
                [userId]
            );

            // 이미지 업데이트
            await dbUtils.query(`
                UPDATE profiles 
                SET profileImage = ?,
                    lastActive = NOW()
                WHERE userId = ?
            `, [imageUrl, userId]);

            return {
                success: true,
                previousImage: profile?.profileImage || null
            };
        } catch (error) {
            throw new Error('프로필 이미지 업데이트 실패: ' + error.message);
        }
    },

    // 온라인 상태 업데이트
    async updateOnlineStatus(userId, isOnline) {
        try {
            await dbUtils.query(`
                UPDATE profiles 
                SET isOnline = ?,
                    lastActive = NOW()
                WHERE userId = ?
            `, [isOnline, userId]);

            return { success: true };
        } catch (error) {
            throw new Error('온라인 상태 업데이트 실패: ' + error.message);
        }
    },

    // 프로필 가시성 업데이트
    async updateVisibility(userId, visibility) {
        try {
            if (!['public', 'friends', 'private'].includes(visibility)) {
                throw new Error('유효하지 않은 가시성 설정입니다');
            }

            await dbUtils.query(`
                UPDATE profiles 
                SET visibility = ?
                WHERE userId = ?
            `, [visibility, userId]);

            return { success: true };
        } catch (error) {
            throw new Error('프로필 가시성 업데이트 실패: ' + error.message);
        }
    }
};

module.exports = profileService;
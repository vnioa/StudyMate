const db = require('../config/db');

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

    validateVisibility(visibility) {
        const validTypes = ['public', 'friends', 'private'];
        return validTypes.includes(visibility);
    },

    validateActivityStatus(status) {
        const validStatus = ['online', 'offline', 'away', 'busy'];
        return validStatus.includes(status);
    }
};

const profileController = {
    // 내 프로필 조회
    getMyProfile: async (req, res) => {
        try {
            const userId = req.user.id;

            const [profile] = await utils.executeQuery(`
        SELECT p.*, a.username, a.name, a.email
        FROM profiles p
        JOIN auth a ON p.memberId = a.id
        WHERE p.memberId = ?
      `, [userId]);

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: '프로필을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                message: '프로필을 성공적으로 조회했습니다.',
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

    // 프로필 수정
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const { nickname, bio } = req.body;

            if (bio && bio.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: '자기소개는 1000자를 초과할 수 없습니다.'
                });
            }

            const result = await utils.executeQuery(`
        UPDATE profiles
        SET nickname = ?,
            bio = ?,
            updatedAt = NOW()
        WHERE memberId = ?
      `, [nickname, bio, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '프로필을 찾을 수 없습니다.'
                });
            }

            const [updatedProfile] = await utils.executeQuery(`
        SELECT p.*, a.username, a.name, a.email
        FROM profiles p
        JOIN auth a ON p.memberId = a.id
        WHERE p.memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                message: '프로필이 성공적으로 수정되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            console.error('프로필 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '프로필 수정에 실패했습니다.'
            });
        }
    },

    // 상태 메시지 업데이트
    updateStatus: async (req, res) => {
        try {
            const userId = req.user.id;
            const { message } = req.body;

            if (message.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: '상태 메시지는 200자를 초과할 수 없습니다.'
                });
            }

            const result = await utils.executeQuery(`
        UPDATE profiles
        SET statusMessage = ?,
            updatedAt = NOW()
        WHERE memberId = ?
      `, [message, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '프로필을 찾을 수 없습니다.'
                });
            }

            const [updatedProfile] = await utils.executeQuery(`
        SELECT p.*, a.username, a.name, a.email
        FROM profiles p
        JOIN auth a ON p.memberId = a.id
        WHERE p.memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                message: '상태 메시지가 성공적으로 업데이트되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            console.error('상태 메시지 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '상태 메시지 업데이트에 실패했습니다.'
            });
        }
    },

    // 프로필 이미지 업로드
    uploadProfileImage: async (req, res) => {
        try {
            const userId = req.user.id;
            const image = req.file;

            if (!image) {
                return res.status(400).json({
                    success: false,
                    message: '이미지 파일이 필요합니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const imageUrl = `uploads/profiles/${userId}/${image.filename}`;

                await connection.execute(`
          UPDATE profiles
          SET profileImage = ?,
              updatedAt = NOW()
          WHERE memberId = ?
        `, [imageUrl, userId]);

                const [updatedProfile] = await connection.execute(`
          SELECT p.*, a.username, a.name, a.email
          FROM profiles p
          JOIN auth a ON p.memberId = a.id
          WHERE p.memberId = ?
        `, [userId]);

                return updatedProfile;
            });

            res.status(200).json({
                success: true,
                message: '프로필 이미지가 성공적으로 업로드되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('프로필 이미지 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '프로필 이미지 업로드에 실패했습니다.'
            });
        }
    },

    // 배경 이미지 업로드
    uploadBackgroundImage: async (req, res) => {
        try {
            const userId = req.user.id;
            const image = req.file;

            if (!image) {
                return res.status(400).json({
                    success: false,
                    message: '이미지 파일이 필요합니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const imageUrl = `uploads/backgrounds/${userId}/${image.filename}`;

                await connection.execute(`
          UPDATE profiles
          SET backgroundImage = ?,
              updatedAt = NOW()
          WHERE memberId = ?
        `, [imageUrl, userId]);

                const [updatedProfile] = await connection.execute(`
          SELECT p.*, a.username, a.name, a.email
          FROM profiles p
          JOIN auth a ON p.memberId = a.id
          WHERE p.memberId = ?
        `, [userId]);

                return updatedProfile;
            });

            res.status(200).json({
                success: true,
                message: '배경 이미지가 성공적으로 업로드되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('배경 이미지 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '배경 이미지 업로드에 실패했습니다.'
            });
        }
    },

    // 활동 상태 업데이트
    updateActivityStatus: async (req, res) => {
        try {
            const userId = req.user.id;
            const { status } = req.body;

            if (!utils.validateActivityStatus(status)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 활동 상태입니다.'
                });
            }

            const result = await utils.executeQuery(`
        UPDATE profiles
        SET activeStatus = ?,
            lastActive = NOW(),
            updatedAt = NOW()
        WHERE memberId = ?
      `, [status, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '프로필을 찾을 수 없습니다.'
                });
            }

            const [updatedProfile] = await utils.executeQuery(`
        SELECT p.*, a.username, a.name, a.email
        FROM profiles p
        JOIN auth a ON p.memberId = a.id
        WHERE p.memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                message: '활동 상태가 성공적으로 업데이트되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            console.error('활동 상태 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '활동 상태 업데이트에 실패했습니다.'
            });
        }
    },

    // 프로필 공개 범위 설정
    updateVisibility: async (req, res) => {
        try {
            const userId = req.user.id;
            const { visibility } = req.body;

            if (!utils.validateVisibility(visibility)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 공개 범위입니다.'
                });
            }

            const result = await utils.executeQuery(`
        UPDATE profiles
        SET visibility = ?,
            updatedAt = NOW()
        WHERE memberId = ?
      `, [visibility, userId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '프로필을 찾을 수 없습니다.'
                });
            }

            const [updatedProfile] = await utils.executeQuery(`
        SELECT p.*, a.username, a.name, a.email
        FROM profiles p
        JOIN auth a ON p.memberId = a.id
        WHERE p.memberId = ?
      `, [userId]);

            res.status(200).json({
                success: true,
                message: '프로필 공개 범위가 성공적으로 업데이트되었습니다.',
                data: updatedProfile
            });
        } catch (error) {
            console.error('프로필 공개 범위 설정 오류:', error);
            res.status(500).json({
                success: false,
                message: '프로필 공개 범위 설정에 실패했습니다.'
            });
        }
    }
};

module.exports = profileController;
const db = require('../config/db');

// Utility functions
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

    validateShareType(shareType) {
        const validTypes = ['view', 'edit', 'download', 'full'];
        return validTypes.includes(shareType);
    }
};

const materialController = {
    // 학습 자료 상세 조회
    getMaterialDetail: async (req, res) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;

            const [material] = await utils.executeQuery(`
        SELECT m.*, 
               ms.shareType,
               u.username as ownerName,
               u.name as ownerFullName
        FROM materials m
        LEFT JOIN material_shares ms ON m.id = ms.materialId AND ms.memberId = ?
        LEFT JOIN auth u ON m.memberId = u.id
        WHERE m.id = ? AND (
            m.memberId = ? 
            OR m.isPublic = true 
            OR ms.id IS NOT NULL
        )
      `, [userId, materialId, userId]);

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: '자료를 찾을 수 없거나 접근 권한이 없습니다.'
                });
            }

            const versions = await utils.executeQuery(`
        SELECT mv.*, u.username as editorName
        FROM material_versions mv
        JOIN auth u ON mv.updatedBy = u.id
        WHERE mv.materialId = ?
        ORDER BY mv.version DESC
      `, [materialId]);

            material.versions = versions;

            res.status(200).json({
                success: true,
                message: '학습 자료를 성공적으로 조회했습니다.',
                data: material
            });
        } catch (error) {
            console.error('학습 자료 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 자료 조회에 실패했습니다.'
            });
        }
    },

    // 학습 자료 수정
    updateMaterial: async (req, res) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;
            const { title, description, content, references, commitMessage } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [material] = await connection.execute(
                    'SELECT * FROM materials WHERE id = ? AND memberId = ?',
                    [materialId, userId]
                );

                if (!material) {
                    throw new Error('자료를 찾을 수 없거나 수정 권한이 없습니다.');
                }

                await connection.execute(`
          INSERT INTO material_versions (
            materialId, version, content, updatedBy, 
            changes, commitMessage, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
                    materialId,
                    material.version,
                    material.content,
                    userId,
                    '자료 업데이트',
                    commitMessage || '내용 수정'
                ]);

                await connection.execute(`
          UPDATE materials
          SET title = ?,
              description = ?,
              content = ?,
              references = ?,
              version = version + 1,
              updatedAt = NOW()
          WHERE id = ?
        `, [title, description, content, references, materialId]);

                return { ...material, title, description, content, references, version: material.version + 1 };
            });

            res.status(200).json({
                success: true,
                message: '학습 자료가 성공적으로 수정되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('학습 자료 수정 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 자료 수정에 실패했습니다.'
            });
        }
    },

    // 학습 자료 공유
    shareMaterial: async (req, res) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;
            const { shareType, recipients } = req.body;

            if (!utils.validateShareType(shareType)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 공유 유형입니다.'
                });
            }

            if (!Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '수신자 목록이 필요합니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                const [material] = await connection.execute(
                    'SELECT * FROM materials WHERE id = ? AND memberId = ?',
                    [materialId, userId]
                );

                if (!material) {
                    throw new Error('자료를 찾을 수 없거나 공유 권한이 없습니다.');
                }

                await connection.execute(
                    'DELETE FROM material_shares WHERE materialId = ? AND memberId IN (?)',
                    [materialId, recipients]
                );

                const shareValues = recipients.map(recipientId => [
                    materialId,
                    recipientId,
                    shareType,
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ]);

                await connection.execute(`
          INSERT INTO material_shares (
            materialId, memberId, shareType, expiresAt
          ) VALUES ?
        `, [shareValues]);

                return { success: true, sharedCount: recipients.length };
            });

            res.status(200).json({
                success: true,
                message: '학습 자료가 성공적으로 공유되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('학습 자료 공유 오류:', error);
            res.status(500).json({
                success: false,
                message: '학습 자료 공유에 실패했습니다.'
            });
        }
    },

    // 학습 자료 다운로드 URL 생성
    getMaterialDownloadUrl: async (req, res) => {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;

            const [material] = await utils.executeQuery(`
        SELECT m.*, ms.shareType
        FROM materials m
        LEFT JOIN material_shares ms ON m.id = ms.materialId 
            AND ms.memberId = ?
            AND (ms.expiresAt IS NULL OR ms.expiresAt > NOW())
        WHERE m.id = ? AND (
            m.memberId = ?
            OR m.isPublic = true
            OR (ms.id IS NOT NULL AND ms.shareType IN ('download', 'full'))
        )
      `, [userId, materialId, userId]);

            if (!material) {
                return res.status(404).json({
                    success: false,
                    message: '자료를 찾을 수 없거나 다운로드 권한이 없습니다.'
                });
            }

            await utils.executeQuery(
                'UPDATE materials SET downloadCount = downloadCount + 1 WHERE id = ?',
                [materialId]
            );

            // 실제 환경에서는 파일 스토리지 서비스의 서명된 URL을 생성하여 반환
            const downloadUrl = material.fileUrl;

            res.status(200).json({
                success: true,
                message: '다운로드 URL이 생성되었습니다.',
                data: { downloadUrl }
            });
        } catch (error) {
            console.error('다운로드 URL 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '다운로드 URL 생성에 실패했습니다.'
            });
        }
    }
};

module.exports = materialController;
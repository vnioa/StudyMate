const db = require('../config/database');
const createError = require('http-errors');

const MaterialController = {
    // 학습 자료 상세 조회
    getMaterialDetail: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { materialId } = req.params;

            const [material] = await connection.query(
                `SELECT m.*, u.name as author_name 
         FROM study_materials m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ? AND (m.user_id = ? OR m.is_shared = true)`,
                [materialId, req.user.id]
            );

            if (!material.length) {
                throw createError(404, '학습 자료를 찾을 수 없습니다.');
            }

            res.json({ material: material[0] });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 자료 수정
    updateMaterial: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { materialId } = req.params;
            const { title, description, content, references } = req.body;

            const [result] = await connection.query(
                `UPDATE study_materials 
         SET title = ?, description = ?, content = ?, references = ?, 
             updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
                [title, description, content, references, materialId, req.user.id]
            );

            if (result.affectedRows === 0) {
                throw createError(403, '학습 자료를 수정할 권한이 없습니다.');
            }

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 자료 공유
    shareMaterial: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { materialId } = req.params;
            const { shareType, recipients } = req.body;

            await connection.beginTransaction();

            // 자료 공유 상태 업데이트
            await connection.query(
                'UPDATE study_materials SET is_shared = true WHERE id = ? AND user_id = ?',
                [materialId, req.user.id]
            );

            // 특정 사용자와 공유하는 경우
            if (recipients && recipients.length > 0) {
                const shares = recipients.map(userId => [materialId, userId, shareType]);
                await connection.query(
                    'INSERT INTO material_shares (material_id, shared_with, share_type) VALUES ?',
                    [shares]
                );
            }

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 학습 자료 다운로드 URL 조회
    getMaterialDownloadUrl: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { materialId } = req.params;

            const [material] = await connection.query(
                'SELECT file_url FROM study_materials WHERE id = ? AND (user_id = ? OR is_shared = true)',
                [materialId, req.user.id]
            );

            if (!material.length) {
                throw createError(404, '학습 자료를 찾을 수 없습니다.');
            }

            // 다운로드 이력 기록
            await connection.query(
                'INSERT INTO material_downloads (material_id, user_id) VALUES (?, ?)',
                [materialId, req.user.id]
            );

            res.json({ downloadUrl: material[0].file_url });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = MaterialController;
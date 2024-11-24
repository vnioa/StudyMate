const db = require('../config/mysql');

class MaterialController {
    // 학습 자료 업로드
    async uploadMaterial(req, res) {
        try {
            const { groupId, title, description, tags } = req.body;
            const userId = req.user.id;
            const file = req.file;

            const [result] = await db.execute(
                'INSERT INTO group_materials (group_id, user_id, title, description, file_path, tags) VALUES (?, ?, ?, ?, ?, ?)',
                [groupId, userId, title, description, file.path, JSON.stringify(tags)]
            );

            res.status(201).json({
                success: true,
                materialId: result.insertId,
                message: '학습 자료가 업로드되었습니다.'
            });
        } catch (error) {
            console.error('자료 업로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '자료 업로드에 실패했습니다.'
            });
        }
    }

    // 학습 자료 목록 조회
    async getMaterials(req, res) {
        try {
            const { groupId, search, tags, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT m.*, u.name as uploader_name
                FROM group_materials m
                         JOIN users u ON m.user_id = u.id
                WHERE m.group_id = ?
            `;
            const params = [groupId];

            if (search) {
                query += ' AND (m.title LIKE ? OR m.description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (tags) {
                query += ' AND JSON_CONTAINS(m.tags, ?)';
                params.push(JSON.stringify(tags));
            }

            query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [materials] = await db.execute(query, params);

            res.status(200).json({
                success: true,
                materials
            });
        } catch (error) {
            console.error('자료 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '자료 목록 조회에 실패했습니다.'
            });
        }
    }

    // 자료 버전 관리
    async createVersion(req, res) {
        try {
            const { materialId } = req.params;
            const { version, description } = req.body;
            const file = req.file;

            await db.execute(
                'INSERT INTO material_versions (material_id, version, description, file_path) VALUES (?, ?, ?, ?)',
                [materialId, version, description, file.path]
            );

            res.status(201).json({
                success: true,
                message: '새 버전이 생성되었습니다.'
            });
        } catch (error) {
            console.error('버전 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '버전 생성에 실패했습니다.'
            });
        }
    }

    // 자료 삭제
    async deleteMaterial(req, res) {
        try {
            const { materialId } = req.params;
            const userId = req.user.id;

            // 권한 확인
            const [material] = await db.execute(
                'SELECT * FROM group_materials WHERE id = ? AND user_id = ?',
                [materialId, userId]
            );

            if (material.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '자료를 삭제할 권한이 없습니다.'
                });
            }

            await db.execute('DELETE FROM group_materials WHERE id = ?', [materialId]);

            res.status(200).json({
                success: true,
                message: '자료가 삭제되었습니다.'
            });
        } catch (error) {
            console.error('자료 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '자료 삭제에 실패했습니다.'
            });
        }
    }
}

module.exports = new MaterialController();
const db = require('../config/mysql');
const { upload } = require('../middleware/upload');

class MaterialService {
    // 학습 자료 업로드
    async uploadMaterial(groupId, userId, title, description, tags, file) {
        try {
            const [result] = await db.execute(
                'INSERT INTO group_materials (group_id, user_id, title, description, file_path, tags) VALUES (?, ?, ?, ?, ?, ?)',
                [groupId, userId, title, description, file.path, JSON.stringify(tags)]
            );

            return result.insertId;
        } catch (error) {
            console.error('자료 업로드 오류:', error);
            throw new Error('자료 업로드에 실패했습니다.');
        }
    }

    // 학습 자료 목록 조회
    async getMaterials(groupId, search, tags, page = 1, limit = 10) {
        try {
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
            return materials;
        } catch (error) {
            console.error('자료 목록 조회 오류:', error);
            throw new Error('자료 목록 조회에 실패했습니다.');
        }
    }

    // 자료 버전 관리
    async createVersion(materialId, description, file, userId) {
        try {
            await db.execute(
                'INSERT INTO material_versions (material_id, version, description, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?)',
                [materialId, file.filename, description, file.path, userId]
            );

            return true;
        } catch (error) {
            console.error('버전 생성 오류:', error);
            throw new Error('버전 생성에 실패했습니다.');
        }
    }

    // 자료 권한 설정
    async updatePermissions(materialId, permissions) {
        try {
            await db.execute(
                'UPDATE group_materials SET permissions = ? WHERE id = ?',
                [JSON.stringify(permissions), materialId]
            );

            return true;
        } catch (error) {
            console.error('권한 설정 오류:', error);
            throw new Error('권한 설정에 실패했습니다.');
        }
    }

    // 자료 태그 업데이트
    async updateTags(materialId, tags) {
        try {
            await db.execute(
                'UPDATE group_materials SET tags = ? WHERE id = ?',
                [JSON.stringify(tags), materialId]
            );

            return true;
        } catch (error) {
            console.error('태그 업데이트 오류:', error);
            throw new Error('태그 업데이트에 실패했습니다.');
        }
    }

    // 자료 삭제
    async deleteMaterial(materialId) {
        try {
            await db.execute('DELETE FROM group_materials WHERE id = ?', [materialId]);
            return true;
        } catch (error) {
            console.error('자료 삭제 오류:', error);
            throw new Error('자료 삭제에 실패했습니다.');
        }
    }
}

module.exports = new MaterialService();
const db = require('../../config/mysql');

class GroupController {
    // 그룹 생성
    async createGroup(req, res) {
        try {
            const { name, description, isPublic, category, maxMembers } = req.body;
            const userId = req.user.id;

            const [result] = await db.execute(
                'INSERT INTO groups (name, description, is_public, category, max_members, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
                [name, description, isPublic, category, maxMembers, userId]
            );

            // 생성자를 그룹의 첫 멤버이자 관리자로 추가
            await db.execute(
                'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
                [result.insertId, userId, 'admin']
            );

            res.status(201).json({
                success: true,
                groupId: result.insertId,
                message: '그룹이 생성되었습니다.'
            });
        } catch (error) {
            console.error('그룹 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 생성에 실패했습니다.'
            });
        }
    }

    // 그룹 목록 조회
    async getGroups(req, res) {
        try {
            const { search, category, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
        SELECT g.*, COUNT(gm.user_id) as member_count 
        FROM groups g 
        LEFT JOIN group_members gm ON g.id = gm.group_id 
        WHERE 1=1
      `;
            const params = [];

            if (search) {
                query += ' AND (g.name LIKE ? OR g.description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            if (category) {
                query += ' AND g.category = ?';
                params.push(category);
            }

            query += ' GROUP BY g.id LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [groups] = await db.execute(query, params);

            res.status(200).json({
                success: true,
                groups
            });
        } catch (error) {
            console.error('그룹 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 목록 조회에 실패했습니다.'
            });
        }
    }

    // 그룹 상세 정보 조회
    async getGroupDetails(req, res) {
        try {
            const { groupId } = req.params;

            const [group] = await db.execute(
                `SELECT g.*, COUNT(gm.user_id) as member_count 
         FROM groups g 
         LEFT JOIN group_members gm ON g.id = gm.group_id 
         WHERE g.id = ?
         GROUP BY g.id`,
                [groupId]
            );

            if (group.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '그룹을 찾을 수 없습니다.'
                });
            }

            // 그룹 멤버 정보 조회
            const [members] = await db.execute(
                `SELECT u.id, u.name, u.profile_image, gm.role 
         FROM group_members gm 
         JOIN users u ON gm.user_id = u.id 
         WHERE gm.group_id = ?`,
                [groupId]
            );

            res.status(200).json({
                success: true,
                group: { ...group[0], members }
            });
        } catch (error) {
            console.error('그룹 상세 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 상세 정보 조회에 실패했습니다.'
            });
        }
    }

    // 그룹 설정 업데이트
    async updateGroupSettings(req, res) {
        try {
            const { groupId } = req.params;
            const { name, description, isPublic, category, maxMembers } = req.body;
            const userId = req.user.id;

            // 권한 확인
            const [admin] = await db.execute(
                'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND role = ?',
                [groupId, userId, 'admin']
            );

            if (admin.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '그룹 설정을 변경할 권한이 없습니다.'
                });
            }

            await db.execute(
                'UPDATE groups SET name = ?, description = ?, is_public = ?, category = ?, max_members = ? WHERE id = ?',
                [name, description, isPublic, category, maxMembers, groupId]
            );

            res.status(200).json({
                success: true,
                message: '그룹 설정이 업데이트되었습니다.'
            });
        } catch (error) {
            console.error('그룹 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 설정 업데이트에 실패했습니다.'
            });
        }
    }

    // 그룹 삭제
    async deleteGroup(req, res) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            // 권한 확인
            const [admin] = await db.execute(
                'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND role = ?',
                [groupId, userId, 'admin']
            );

            if (admin.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: '그룹을 삭제할 권한이 없습니다.'
                });
            }

            await db.beginTransaction();

            try {
                // 관련된 모든 데이터 삭제
                await db.execute('DELETE FROM group_members WHERE group_id = ?', [groupId]);
                await db.execute('DELETE FROM group_materials WHERE group_id = ?', [groupId]);
                await db.execute('DELETE FROM group_activities WHERE group_id = ?', [groupId]);
                await db.execute('DELETE FROM groups WHERE id = ?', [groupId]);

                await db.commit();

                res.status(200).json({
                    success: true,
                    message: '그룹이 삭제되었습니다.'
                });
            } catch (error) {
                await db.rollback();
                throw error;
            }
        } catch (error) {
            console.error('그룹 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 삭제에 실패했습니다.'
            });
        }
    }
}

module.exports = new GroupController();
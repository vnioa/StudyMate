const db = require('../../config/mysql');

class GroupService {
    // 그룹 생성
    async createGroup(name, description, isPublic, category, maxMembers, creatorId) {
        try {
            const [result] = await db.execute(
                'INSERT INTO groups (name, description, is_public, category, max_members, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
                [name, description, isPublic, category, maxMembers, creatorId]
            );

            // 생성자를 그룹의 첫 멤버이자 관리자로 추가
            await db.execute(
                'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
                [result.insertId, creatorId, 'admin']
            );

            return result.insertId;
        } catch (error) {
            console.error('그룹 생성 오류:', error);
            throw new Error('그룹 생성에 실패했습니다.');
        }
    }

    // 그룹 목록 조회
    async getGroups(search, category, page = 1, limit = 10) {
        try {
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
            return groups;
        } catch (error) {
            console.error('그룹 목록 조회 오류:', error);
            throw new Error('그룹 목록 조회에 실패했습니다.');
        }
    }

    // 그룹 상세 정보 조회
    async getGroupDetails(groupId) {
        try {
            const [group] = await db.execute(
                `SELECT g.*, COUNT(gm.user_id) as member_count
                 FROM groups g
                          LEFT JOIN group_members gm ON g.id = gm.group_id
                 WHERE g.id = ?
                 GROUP BY g.id`,
                [groupId]
            );

            if (group.length === 0) {
                throw new Error('그룹을 찾을 수 없습니다.');
            }

            const [members] = await db.execute(
                `SELECT u.id, u.name, u.profile_image, gm.role
                 FROM group_members gm
                          JOIN users u ON gm.user_id = u.id
                 WHERE gm.group_id = ?`,
                [groupId]
            );

            return { ...group[0], members };
        } catch (error) {
            console.error('그룹 상세 정보 조회 오류:', error);
            throw new Error('그룹 상세 정보 조회에 실패했습니다.');
        }
    }

    // 그룹 설정 업데이트
    async updateGroupSettings(groupId, settings) {
        try {
            const { name, description, isPublic, category, maxMembers } = settings;

            await db.execute(
                'UPDATE groups SET name = ?, description = ?, is_public = ?, category = ?, max_members = ? WHERE id = ?',
                [name, description, isPublic, category, maxMembers, groupId]
            );

            return true;
        } catch (error) {
            console.error('그룹 설정 업데이트 오류:', error);
            throw new Error('그룹 설정 업데이트에 실패했습니다.');
        }
    }

    // 그룹 삭제
    async deleteGroup(groupId) {
        try {
            await db.beginTransaction();

            try {
                await db.execute('DELETE FROM group_members WHERE group_id = ?', [groupId]);
                await db.execute('DELETE FROM group_materials WHERE group_id = ?', [groupId]);
                await db.execute('DELETE FROM group_activities WHERE group_id = ?', [groupId]);
                await db.execute('DELETE FROM groups WHERE id = ?', [groupId]);

                await db.commit();
                return true;
            } catch (error) {
                await db.rollback();
                throw error;
            }
        } catch (error) {
            console.error('그룹 삭제 오류:', error);
            throw new Error('그룹 삭제에 실패했습니다.');
        }
    }
}

module.exports = new GroupService();
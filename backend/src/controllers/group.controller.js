const db = require('../config/mysql');
const createError = require('http-errors');
const { uploadToStorage } = require('../utils/fileUpload');

const GroupController = {
    // 그룹 활동 내역 조회
    getGroupActivities: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            const [activities] = await connection.query(
                `SELECT a.*, u.name as user_name
                 FROM group_activities a
                          JOIN users u ON a.user_id = u.id
                 WHERE a.group_id = ?
                 ORDER BY a.created_at DESC`,
                [groupId]
            );
            res.json({ activities });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 멘토링 정보 조회
    getMentoringInfo: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            const [[mentors], [mentees]] = await Promise.all([
                connection.query(
                    'SELECT * FROM group_mentors WHERE group_id = ?',
                    [groupId]
                ),
                connection.query(
                    'SELECT * FROM group_mentees WHERE group_id = ?',
                    [groupId]
                )
            ]);
            res.json({ mentors, mentees });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 멤버 활동 내역 조회
    getMemberActivities: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            const [activities] = await connection.query(
                `SELECT a.*, u.name as user_name
                 FROM member_activities a
                          JOIN users u ON a.user_id = u.id
                 WHERE a.group_id = ?
                 ORDER BY a.created_at DESC`,
                [groupId]
            );
            res.json({ activities });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 그룹 생성
    createGroup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const imageUrl = req.file ? await uploadToStorage(req.file) : null;

            const [result] = await connection.query(
                'INSERT INTO groups (name, description, image_url, created_by) VALUES (?, ?, ?, ?)',
                [req.body.name, req.body.description, imageUrl, req.user.id]
            );

            await connection.query(
                'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "admin")',
                [result.insertId, req.user.id]
            );

            await connection.commit();
            res.json({
                success: true,
                groupId: result.insertId
            });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 그룹 목록 조회
    getGroups: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const [groups] = await connection.query(
                `SELECT g.*, COUNT(gm.id) as member_count
                 FROM groups g
                          LEFT JOIN group_members gm ON g.id = gm.group_id
                 GROUP BY g.id
                 ORDER BY g.created_at DESC`
            );
            res.json({ groups });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 그룹 상세 정보 조회
    getGroupDetail: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            const [[group], [members]] = await Promise.all([
                connection.query(
                    'SELECT * FROM groups WHERE id = ?',
                    [groupId]
                ),
                connection.query(
                    `SELECT u.*, gm.role
                     FROM group_members gm
                              JOIN users u ON gm.user_id = u.id
                     WHERE gm.group_id = ?`,
                    [groupId]
                )
            ]);

            if (!group) {
                throw createError(404, '그룹을 찾을 수 없습니다.');
            }

            res.json({
                group: {
                    ...group,
                    members
                }
            });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 그룹 삭제
    deleteGroup: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            await connection.beginTransaction();

            const [group] = await connection.query(
                'SELECT * FROM groups WHERE id = ? AND created_by = ?',
                [groupId, req.user.id]
            );

            if (!group.length) {
                throw createError(403, '그룹을 삭제할 권한이 없습니다.');
            }

            await Promise.all([
                connection.query('DELETE FROM group_members WHERE group_id = ?', [groupId]),
                connection.query('DELETE FROM groups WHERE id = ?', [groupId])
            ]);

            await connection.commit();
            res.json({ success: true });
        } catch (err) {
            await connection.rollback();
            next(err);
        } finally {
            connection.release();
        }
    },

    // 그룹 설정 조회
    getGroupSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            const [settings] = await connection.query(
                'SELECT * FROM group_settings WHERE group_id = ?',
                [groupId]
            );
            res.json({ settings: settings[0] || {} });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    },

    // 그룹 설정 업데이트
    updateGroupSettings: async (req, res, next) => {
        const connection = await db.getConnection();
        try {
            const { groupId } = req.params;
            const { category, memberLimit } = req.body;

            await connection.query(
                `INSERT INTO group_settings (group_id, category, member_limit)
                 VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                                          category = VALUES(category),
                                          member_limit = VALUES(member_limit)`,
                [groupId, category, memberLimit]
            );

            res.json({ success: true });
        } catch (err) {
            next(err);
        } finally {
            connection.release();
        }
    }
};

module.exports = GroupController;
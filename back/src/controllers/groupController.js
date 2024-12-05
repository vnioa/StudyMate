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
    }
};

const groupController = {
    // 그룹 활동 조회
    getGroupActivities: async (req, res) => {
        try {
            const { groupId } = req.params;

            const activities = await utils.executeQuery(`
        SELECT ga.*, a.username, a.name, a.profileImage 
        FROM study_group_activities ga
        JOIN auth a ON ga.memberId = a.id
        WHERE ga.groupId = ?
        ORDER BY ga.createdAt DESC
      `, [groupId]);

            res.status(200).json({
                success: true,
                data: activities
            });
        } catch (error) {
            console.error('그룹 활동 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 활동 조회에 실패했습니다.'
            });
        }
    },

    // 멘토링 정보 조회
    getMentoringInfo: async (req, res) => {
        try {
            const { groupId } = req.params;

            const mentors = await utils.executeQuery(`
        SELECT gm.*, a.username, a.name, a.profileImage
        FROM study_group_members gm
        JOIN auth a ON gm.memberId = a.id
        WHERE gm.groupId = ? AND gm.role = 'admin'
      `, [groupId]);

            res.status(200).json({
                success: true,
                data: mentors
            });
        } catch (error) {
            console.error('멘토링 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '멘토링 정보 조회에 실패했습니다.'
            });
        }
    },

    // 멤버 활동 조회
    getMemberActivities: async (req, res) => {
        try {
            const { groupId } = req.params;

            const activities = await utils.executeQuery(`
        SELECT ga.*, a.username, a.name
        FROM study_group_activities ga
        JOIN auth a ON ga.memberId = a.id
        WHERE ga.groupId = ?
        ORDER BY ga.createdAt DESC
      `, [groupId]);

            res.status(200).json({
                success: true,
                data: activities
            });
        } catch (error) {
            console.error('멤버 활동 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '멤버 활동 조회에 실패했습니다.'
            });
        }
    },

    // 그룹 상세 정보 조회
    getGroupDetail: async (req, res) => {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            const [group] = await utils.executeQuery(`
        SELECT g.*, 
               COUNT(DISTINCT gm.memberId) as memberCount,
               gs.joinApproval, gs.postApproval, gs.allowInvites, gs.visibility
        FROM study_groups g
        LEFT JOIN study_group_members gm ON g.id = gm.groupId
        LEFT JOIN study_group_settings gs ON g.id = gs.groupId
        WHERE g.id = ?
        GROUP BY g.id
      `, [groupId]);

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: '그룹을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: group
            });
        } catch (error) {
            console.error('그룹 상세 정보 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 상세 정보 조회에 실패했습니다.'
            });
        }
    },

    // 그룹 생성
    createGroup: async (req, res) => {
        try {
            const userId = req.user.id;
            const groupData = {
                ...req.body,
                createdBy: userId,
                image: req.file ? req.file.path : null
            };

            const result = await utils.executeTransaction(async (connection) => {
                const [group] = await connection.execute(`
          INSERT INTO study_groups (
            name, description, image, category, memberLimit,
            isPublic, createdBy, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
                    groupData.name,
                    groupData.description,
                    groupData.image,
                    groupData.category,
                    groupData.memberLimit || 100,
                    groupData.isPublic !== false,
                    groupData.createdBy
                ]);

                await connection.execute(`
          INSERT INTO study_group_settings (
            groupId, joinApproval, postApproval, allowInvites, visibility
          ) VALUES (?, true, false, true, 'public')
        `, [group.insertId]);

                await connection.execute(`
          INSERT INTO study_group_members (
            groupId, memberId, role, joinedAt
          ) VALUES (?, ?, 'admin', NOW())
        `, [group.insertId, userId]);

                return { id: group.insertId, ...groupData };
            });

            res.status(201).json({
                success: true,
                message: '그룹이 생성되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('그룹 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 생성에 실패했습니다.'
            });
        }
    },

    // 멤버 초대
    inviteMembers: async (req, res) => {
        try {
            const { groupId } = req.params;
            const { userIds } = req.body;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const [admin] = await connection.execute(
                    'SELECT * FROM study_group_members WHERE groupId = ? AND memberId = ? AND role = "admin"',
                    [groupId, userId]
                );

                if (!admin) {
                    throw new Error('멤버 초대 권한이 없습니다.');
                }

                for (const inviteeId of userIds) {
                    await connection.execute(`
            INSERT INTO study_group_join_requests (
              groupId, memberId, status, message, createdAt
            ) VALUES (?, ?, 'pending', '관리자로부터 초대되었습니다.', NOW())
          `, [groupId, inviteeId]);
                }
            });

            res.status(200).json({
                success: true,
                message: '초대가 발송되었습니다.'
            });
        } catch (error) {
            console.error('멤버 초대 오류:', error);
            res.status(500).json({
                success: false,
                message: '멤버 초대에 실패했습니다.'
            });
        }
    },

    // 초대 코드 생성
    createInvitation: async (req, res) => {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            const [admin] = await utils.executeQuery(
                'SELECT * FROM study_group_members WHERE groupId = ? AND memberId = ? AND role = "admin"',
                [groupId, userId]
            );

            if (!admin) {
                return res.status(403).json({
                    success: false,
                    message: '초대 코드 생성 권한이 없습니다.'
                });
            }

            const inviteCode = Math.random().toString(36).substring(2, 15);
            await utils.executeQuery(`
        UPDATE study_groups 
        SET inviteCode = ?, inviteCodeExpiry = DATE_ADD(NOW(), INTERVAL 7 DAY)
        WHERE id = ?
      `, [inviteCode, groupId]);

            res.status(201).json({
                success: true,
                data: { inviteCode }
            });
        } catch (error) {
            console.error('초대 코드 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '초대 코드 생성에 실패했습니다.'
            });
        }
    },

    // 그룹 가입
    joinGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;
            const { message } = req.body;

            await utils.executeTransaction(async (connection) => {
                const [group] = await connection.execute(
                    'SELECT * FROM study_groups WHERE id = ?',
                    [groupId]
                );

                if (!group) {
                    throw new Error('그룹을 찾을 수 없습니다.');
                }

                const [settings] = await connection.execute(
                    'SELECT * FROM study_group_settings WHERE groupId = ?',
                    [groupId]
                );

                if (settings.joinApproval) {
                    await connection.execute(`
            INSERT INTO study_group_join_requests (
              groupId, memberId, status, message, createdAt
            ) VALUES (?, ?, 'pending', ?, NOW())
          `, [groupId, userId, message]);
                } else {
                    await connection.execute(`
            INSERT INTO study_group_members (
              groupId, memberId, role, joinedAt
            ) VALUES (?, ?, 'member', NOW())
          `, [groupId, userId]);
                }
            });

            res.status(200).json({
                success: true,
                message: '그룹 가입 요청이 전송되었습니다.'
            });
        } catch (error) {
            console.error('그룹 가입 오류:', error);
            res.status(500).json({
                success: false,
                message: '그룹 가입에 실패했습니다.'
            });
        }
    },

    // 피드 액션 처리
    handleFeedAction: async (req, res) => {
        try {
            const { groupId, feedId, actionType } = req.params;
            const userId = req.user.id;

            const validActions = ['like', 'bookmark', 'report'];
            if (!validActions.includes(actionType)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 액션 타입입니다.'
                });
            }

            await utils.executeTransaction(async (connection) => {
                const [feed] = await connection.execute(
                    'SELECT * FROM group_feeds WHERE id = ? AND groupId = ?',
                    [feedId, groupId]
                );

                if (!feed) {
                    throw new Error('피드를 찾을 수 없습니다.');
                }

                const actionTable = {
                    like: 'feed_likes',
                    bookmark: 'feed_bookmarks',
                    report: 'feed_reports'
                };

                await connection.execute(`
          INSERT INTO ${actionTable[actionType]} (feedId, memberId, createdAt)
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE updatedAt = NOW()
        `, [feedId, userId]);
            });

            const messages = {
                like: '피드를 좋아요했습니다.',
                bookmark: '피드를 북마크했습니다.',
                report: '피드가 신고되었습니다.'
            };

            res.status(200).json({
                success: true,
                message: messages[actionType]
            });
        } catch (error) {
            console.error('피드 액션 처리 오류:', error);
            res.status(500).json({
                success: false,
                message: '피드 액션 처리에 실패했습니다.'
            });
        }
    }
};

module.exports = groupController;
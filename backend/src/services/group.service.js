const { dbUtils } = require('../config/db');

const groupService = {
    // 그룹 활동 조회
    async getGroupActivities(groupId) {
        try {
            const query = `
                SELECT ga.*, a.username, a.name, a.profileImage
                FROM study_group_activities ga
                JOIN auth a ON ga.memberId = a.id
                WHERE ga.groupId = ?
                ORDER BY ga.createdAt DESC
            `;
            return await dbUtils.query(query, [groupId]);
        } catch (error) {
            throw new Error('그룹 활동 조회 실패: ' + error.message);
        }
    },

    // 멘토링 정보 조회
    async getMentoringInfo(groupId) {
        try {
            const query = `
                SELECT gm.*, a.username, a.name, a.profileImage
                FROM study_group_members gm
                JOIN auth a ON gm.memberId = a.id
                WHERE gm.groupId = ? AND gm.role = 'admin'
            `;
            return await dbUtils.query(query, [groupId]);
        } catch (error) {
            throw new Error('멘토링 정보 조회 실패: ' + error.message);
        }
    },

    // 멤버 활동 조회
    async getMemberActivities(groupId) {
        try {
            const query = `
                SELECT ga.*, a.username, a.name
                FROM study_group_activities ga
                JOIN auth a ON ga.memberId = a.id
                WHERE ga.groupId = ?
                ORDER BY ga.createdAt DESC
            `;
            return await dbUtils.query(query, [groupId]);
        } catch (error) {
            throw new Error('멤버 활동 조회 실패: ' + error.message);
        }
    },

    // 그룹 상세 정보 조회
    async getGroupDetail(groupId, userId) {
        try {
            const query = `
                SELECT g.*, 
                       COUNT(DISTINCT gm.memberId) as memberCount,
                       gs.joinApproval, gs.postApproval, gs.allowInvites, gs.visibility
                FROM study_groups g
                LEFT JOIN study_group_members gm ON g.id = gm.groupId
                LEFT JOIN study_group_settings gs ON g.id = gs.groupId
                WHERE g.id = ?
                GROUP BY g.id
            `;
            const [group] = await dbUtils.query(query, [groupId]);
            if (!group) {
                throw new Error('그룹을 찾을 수 없습니다.');
            }
            return group;
        } catch (error) {
            throw new Error('그룹 상세 정보 조회 실패: ' + error.message);
        }
    },

    // 그룹 생성
    async createGroup(groupData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO study_groups (
                        name, description, image, category, 
                        memberLimit, isPublic, createdBy, createdAt
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

                const groupId = result.insertId;

                // 그룹 설정 생성
                await connection.query(`
                    INSERT INTO study_group_settings (
                        groupId, joinApproval, postApproval, 
                        allowInvites, visibility
                    ) VALUES (?, true, false, true, 'public')
                `, [groupId]);

                // 생성자를 관리자로 추가
                await connection.query(`
                    INSERT INTO study_group_members (
                        groupId, memberId, role, joinedAt
                    ) VALUES (?, ?, 'admin', NOW())
                `, [groupId, groupData.createdBy]);

                return { id: groupId, ...groupData };
            } catch (error) {
                throw new Error('그룹 생성 실패: ' + error.message);
            }
        });
    },

    // 그룹 목록 조회
    async getGroups(options = {}) {
        try {
            let query = `
                SELECT g.*, 
                       COUNT(DISTINCT gm.memberId) as memberCount,
                       a.username as creatorName
                FROM study_groups g
                LEFT JOIN study_group_members gm ON g.id = gm.groupId
                LEFT JOIN auth a ON g.createdBy = a.id
                WHERE g.deletedAt IS NULL
            `;

            const params = [];
            if (options.category) {
                query += ' AND g.category = ?';
                params.push(options.category);
            }

            if (options.search) {
                query += ' AND (g.name LIKE ? OR g.description LIKE ?)';
                params.push(`%${options.search}%`, `%${options.search}%`);
            }

            query += ' GROUP BY g.id';

            if (options.sort) {
                query += ` ORDER BY ${options.sort} DESC`;
            } else {
                query += ' ORDER BY g.createdAt DESC';
            }

            return await dbUtils.query(query, params);
        } catch (error) {
            throw new Error('그룹 목록 조회 실패: ' + error.message);
        }
    },

    async getRecentGroups() {
        try {
            const query = `
            SELECT g.*, COUNT(gm.memberId) as memberCount,
                   a.username as creatorName
            FROM study_groups g
            LEFT JOIN study_group_members gm ON g.id = gm.groupId
            LEFT JOIN auth a ON g.createdBy = a.id
            WHERE g.status = 'active'
            GROUP BY g.id
            ORDER BY g.createdAt DESC
            LIMIT 5
        `;

            return await dbUtils.query(query);
        } catch (error) {
            throw new Error('최근 그룹 조회 실패: ' + error.message);
        }
    },

// 그룹 삭제
    async deleteGroup(groupId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('그룹 삭제 권한이 없습니다.');
                }

                await connection.query(`
                UPDATE study_groups 
                SET status = 'closed', deletedAt = NOW()
                WHERE id = ?
            `, [groupId]);

                await connection.query(`
                UPDATE study_group_members
                SET deletedAt = NOW()
                WHERE groupId = ?
            `, [groupId]);

                return { success: true };
            } catch (error) {
                throw new Error('그룹 삭제 실패: ' + error.message);
            }
        });
    },

// 그룹 정보 수정
    async updateGroup(groupId, userId, updateData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('그룹 수정 권한이 없습니다.');
                }

                await connection.query(`
                UPDATE study_groups
                SET name = ?, category = ?, description = ?, 
                    memberLimit = ?, updatedAt = NOW()
                WHERE id = ?
            `, [
                    updateData.name,
                    updateData.category,
                    updateData.description,
                    updateData.memberLimit,
                    groupId
                ]);

                return { id: groupId, ...updateData };
            } catch (error) {
                throw new Error('그룹 정보 수정 실패: ' + error.message);
            }
        });
    },

// 멤버 상세 정보 조회
    async getMemberDetail(groupId, memberId) {
        try {
            const query = `
            SELECT gm.*, a.username, a.name, a.profileImage,
                   a.lastLogin
            FROM study_group_members gm
            JOIN auth a ON gm.memberId = a.id
            WHERE gm.groupId = ? AND gm.memberId = ?
        `;

            const [member] = await dbUtils.query(query, [groupId, memberId]);
            if (!member) {
                throw new Error('멤버를 찾을 수 없습니다.');
            }

            return member;
        } catch (error) {
            throw new Error('멤버 상세 정보 조회 실패: ' + error.message);
        }
    },

// 그룹 멤버 목록 조회
    async getGroupMembers(groupId) {
        try {
            const query = `
            SELECT gm.*, a.username, a.name, a.profileImage,
                   a.lastLogin
            FROM study_group_members gm
            JOIN auth a ON gm.memberId = a.id
            WHERE gm.groupId = ? AND gm.deletedAt IS NULL
            ORDER BY gm.role DESC, gm.joinedAt ASC
        `;

            return await dbUtils.query(query, [groupId]);
        } catch (error) {
            throw new Error('그룹 멤버 목록 조회 실패: ' + error.message);
        }
    },

// 멤버 검색
    async searchMembers(groupId, query) {
        try {
            const searchQuery = `
            SELECT gm.*, a.username, a.name, a.profileImage
            FROM study_group_members gm
            JOIN auth a ON gm.memberId = a.id
            WHERE gm.groupId = ? 
            AND gm.deletedAt IS NULL
            AND (a.username LIKE ? OR a.name LIKE ?)
            ORDER BY gm.role DESC, a.username ASC
        `;

            return await dbUtils.query(searchQuery, [
                groupId,
                `%${query}%`,
                `%${query}%`
            ]);
        } catch (error) {
            throw new Error('멤버 검색 실패: ' + error.message);
        }
    },

// 가입 요청 목록 조회
    async getJoinRequests(groupId) {
        try {
            const query = `
            SELECT jr.*, a.username, a.name, a.profileImage
            FROM study_group_join_requests jr
            JOIN auth a ON jr.memberId = a.id
            WHERE jr.groupId = ? AND jr.status = 'pending'
            ORDER BY jr.createdAt DESC
        `;

            return await dbUtils.query(query, [groupId]);
        } catch (error) {
            throw new Error('가입 요청 목록 조회 실패: ' + error.message);
        }
    },

// 가입 요청 처리
    async handleJoinRequest(groupId, requestId, action, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('요청 처리 권한이 없습니다.');
                }

                if (action === 'accept') {
                    const [request] = await connection.query(`
                    SELECT * FROM study_group_join_requests
                    WHERE id = ? AND status = 'pending'
                `, [requestId]);

                    if (!request) {
                        throw new Error('유효하지 않은 요청입니다.');
                    }

                    await connection.query(`
                    INSERT INTO study_group_members (
                        groupId, memberId, role, joinedAt
                    ) VALUES (?, ?, 'member', NOW())
                `, [groupId, request.memberId]);
                }

                await connection.query(`
                UPDATE study_group_join_requests
                SET status = ?, updatedAt = NOW()
                WHERE id = ?
            `, [action === 'accept' ? 'accepted' : 'rejected', requestId]);

                return { success: true };
            } catch (error) {
                throw new Error('가입 요청 처리 실패: ' + error.message);
            }
        });
    },

// 초대 가능한 멤버 목록 조회
    async getAvailableMembers(groupId) {
        try {
            const query = `
            SELECT a.id, a.username, a.name, a.profileImage
            FROM auth a
            WHERE a.id NOT IN (
                SELECT memberId 
                FROM study_group_members 
                WHERE groupId = ? AND deletedAt IS NULL
            )
            AND a.status = 'active'
            ORDER BY a.username
        `;

            return await dbUtils.query(query, [groupId]);
        } catch (error) {
            throw new Error('초대 가능한 멤버 목록 조회 실패: ' + error.message);
        }
    },

    // 다중 멤버 요청 처리
    async handleBulkMemberRequests(groupId, requestIds, action, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('요청 처리 권한이 없습니다.');
                }

                for (const requestId of requestIds) {
                    if (action === 'accept') {
                        const [request] = await connection.query(`
                        SELECT * FROM study_group_join_requests
                        WHERE id = ? AND status = 'pending'
                    `, [requestId]);

                        if (request) {
                            await connection.query(`
                            INSERT INTO study_group_members (
                                groupId, memberId, role, joinedAt
                            ) VALUES (?, ?, 'member', NOW())
                        `, [groupId, request.memberId]);
                        }
                    }

                    await connection.query(`
                    UPDATE study_group_join_requests
                    SET status = ?, updatedAt = NOW()
                    WHERE id = ?
                `, [action === 'accept' ? 'accepted' : 'rejected', requestId]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('다중 멤버 요청 처리 실패: ' + error.message);
            }
        });
    },

// 멤버 요청 상세 조회
    async getMemberRequestDetail(groupId, requestId) {
        try {
            const query = `
            SELECT jr.*, a.username, a.name, a.profileImage,
                   a.email
            FROM study_group_join_requests jr
            JOIN auth a ON jr.memberId = a.id
            WHERE jr.groupId = ? AND jr.id = ?
        `;

            const [request] = await dbUtils.query(query, [groupId, requestId]);
            if (!request) {
                throw new Error('요청을 찾을 수 없습니다.');
            }

            return request;
        } catch (error) {
            throw new Error('멤버 요청 상세 조회 실패: ' + error.message);
        }
    },

// 그룹 멤버 추가
    async addGroupMember(groupId, memberId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('멤버 추가 권한이 없습니다.');
                }

                await connection.query(`
                INSERT INTO study_group_members (
                    groupId, memberId, role, joinedAt
                ) VALUES (?, ?, 'member', NOW())
            `, [groupId, memberId]);

                await connection.query(`
                INSERT INTO study_group_activities (
                    groupId, memberId, type, content, createdAt
                ) VALUES (?, ?, 'join', '새 멤버가 그룹에 참여했습니다.', NOW())
            `, [groupId, memberId]);

                return { success: true };
            } catch (error) {
                throw new Error('그룹 멤버 추가 실패: ' + error.message);
            }
        });
    },

// 멤버 초대
    async inviteMembers(groupId, userIds, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('멤버 초대 권한이 없습니다.');
                }

                for (const inviteeId of userIds) {
                    await connection.query(`
                    INSERT INTO study_group_join_requests (
                        groupId, memberId, status, message, createdAt
                    ) VALUES (?, ?, 'pending', '관리자로부터 초대되었습니다.', NOW())
                `, [groupId, inviteeId]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('멤버 초대 실패: ' + error.message);
            }
        });
    },

// 초대 코드 생성
    async createInvitation(groupId, userId) {
        try {
            const [admin] = await dbUtils.query(`
            SELECT * FROM study_group_members 
            WHERE groupId = ? AND memberId = ? AND role = 'admin'
        `, [groupId, userId]);

            if (!admin) {
                throw new Error('초대 코드 생성 권한이 없습니다.');
            }

            const inviteCode = Math.random().toString(36).substring(2, 15);

            await dbUtils.query(`
            UPDATE study_groups
            SET inviteCode = ?, inviteCodeExpiry = DATE_ADD(NOW(), INTERVAL 7 DAY)
            WHERE id = ?
        `, [inviteCode, groupId]);

            return { inviteCode };
        } catch (error) {
            throw new Error('초대 코드 생성 실패: ' + error.message);
        }
    },

// 멤버 제거
    async removeMember(groupId, memberId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('멤버 제거 권한이 없습니다.');
                }

                await connection.query(`
                UPDATE study_group_members
                SET deletedAt = NOW()
                WHERE groupId = ? AND memberId = ?
            `, [groupId, memberId]);

                await connection.query(`
                INSERT INTO study_group_activities (
                    groupId, memberId, type, content, createdAt
                ) VALUES (?, ?, 'leave', '멤버가 그룹에서 제거되었습니다.', NOW())
            `, [groupId, memberId]);

                return { success: true };
            } catch (error) {
                throw new Error('멤버 제거 실패: ' + error.message);
            }
        });
    },

// 멤버 역할 수정
    async updateMemberRole(groupId, memberId, role, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('역할 수정 권한이 없습니다.');
                }

                await connection.query(`
                UPDATE study_group_members
                SET role = ?, updatedAt = NOW()
                WHERE groupId = ? AND memberId = ?
            `, [role, groupId, memberId]);

                return { success: true, role };
            } catch (error) {
                throw new Error('멤버 역할 수정 실패: ' + error.message);
            }
        });
    },

    // 그룹 설정 조회
    async getGroupSettings(groupId) {
        try {
            const query = `
            SELECT * FROM study_group_settings
            WHERE groupId = ?
        `;
            const [settings] = await dbUtils.query(query, [groupId]);
            if (!settings) {
                throw new Error('그룹 설정을 찾을 수 없습니다.');
            }
            return settings;
        } catch (error) {
            throw new Error('그룹 설정 조회 실패: ' + error.message);
        }
    },

// 그룹 설정 수정
    async updateGroupSettings(groupId, settings, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('그룹 설정 수정 권한이 없습니다.');
                }

                await connection.query(`
                UPDATE study_group_settings
                SET joinApproval = ?, postApproval = ?, 
                    allowInvites = ?, visibility = ?
                WHERE groupId = ?
            `, [
                    settings.joinApproval,
                    settings.postApproval,
                    settings.allowInvites,
                    settings.visibility,
                    groupId
                ]);

                return { success: true, ...settings };
            } catch (error) {
                throw new Error('그룹 설정 수정 실패: ' + error.message);
            }
        });
    },

// 그룹 이미지 업로드
    async uploadGroupImage(groupId, imagePath, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ? AND role = 'admin'
            `, [groupId, userId]);

                if (!admin) {
                    throw new Error('그룹 이미지 업로드 권한이 없습니다.');
                }

                await connection.query(`
                UPDATE study_groups
                SET image = ?, updatedAt = NOW()
                WHERE id = ?
            `, [imagePath, groupId]);

                return { success: true, imagePath };
            } catch (error) {
                throw new Error('그룹 이미지 업로드 실패: ' + error.message);
            }
        });
    },

// 그룹 가입
    async joinGroup(groupId, userId, message) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [group] = await connection.query(`
                SELECT * FROM study_groups WHERE id = ?
            `, [groupId]);

                if (!group) {
                    throw new Error('그룹을 찾을 수 없습니다.');
                }

                const [settings] = await connection.query(`
                SELECT * FROM study_group_settings WHERE groupId = ?
            `, [groupId]);

                if (settings.joinApproval) {
                    await connection.query(`
                    INSERT INTO study_group_join_requests 
                    (groupId, memberId, status, message, createdAt)
                    VALUES (?, ?, 'pending', ?, NOW())
                `, [groupId, userId, message]);
                } else {
                    await connection.query(`
                    INSERT INTO study_group_members 
                    (groupId, memberId, role, joinedAt)
                    VALUES (?, ?, 'member', NOW())
                `, [groupId, userId]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('그룹 가입 요청 실패: ' + error.message);
            }
        });
    },

// 그룹 탈퇴
    async leaveGroup(groupId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [member] = await connection.query(`
                SELECT * FROM study_group_members 
                WHERE groupId = ? AND memberId = ?
            `, [groupId, userId]);

                if (!member) {
                    throw new Error('그룹 멤버가 아닙니다.');
                }

                await connection.query(`
                DELETE FROM study_group_members
                WHERE groupId = ? AND memberId = ?
            `, [groupId, userId]);

                await connection.query(`
                INSERT INTO study_group_activities 
                (groupId, memberId, type, content, createdAt)
                VALUES (?, ?, 'leave', '멤버가 그룹을 탈퇴했습니다.', NOW())
            `, [groupId, userId]);

                return { success: true };
            } catch (error) {
                throw new Error('그룹 탈퇴 실패: ' + error.message);
            }
        });
    }
};

module.exports = groupService;
const { dbUtils } = require('../config/db');

const groupService = {
    // 그룹 활동 조회
    async getGroupActivities(groupId) {
        try {
            const query = `
                SELECT ga.*, u.name as userName
                FROM group_activities ga
                JOIN users u ON ga.userId = u.id
                WHERE ga.groupId = ?
                ORDER BY ga.createdAt DESC
            `;
            const activities = await dbUtils.query(query, [groupId]);
            return { activities };
        } catch (error) {
            throw new Error('그룹 활동 조회 실패: ' + error.message);
        }
    },
    // 멘토링 정보 조회
    async getMentoringInfo(groupId) {
        try {
            const query = `
                SELECT m.*, u.name, u.profileImage
                FROM mentors m
                JOIN users u ON m.userId = u.id
                JOIN group_members gm ON m.userId = gm.userId
                WHERE gm.groupId = ? AND gm.role = 'admin'
            `;
            const mentoring = await dbUtils.query(query, [groupId]);
            return { mentoring };
        } catch (error) {
            throw new Error('멘토링 정보 조회 실패: ' + error.message);
        }
    },
    // 멤버 활동 조회
    async getMemberActivities(groupId) {
        try {
            const query = `
                SELECT ga.*, u.name as userName
                FROM group_activities ga
                JOIN users u ON ga.userId = u.id
                WHERE ga.groupId = ?
                ORDER BY ga.createdAt DESC
            `;
            const activities = await dbUtils.query(query, [groupId]);
            return { activities };
        } catch (error) {
            throw new Error('멤버 활동 조회 실패: ' + error.message);
        }
    },



    // 그룹 상세 정보 조회
    async getGroupDetail(groupId) {
        try {
            const query = `
                SELECT g.*, 
                       u.name as creatorName,
                       COUNT(DISTINCT gm.userId) as memberCount,
                       gs.*
                FROM groups g
                JOIN users u ON g.createdBy = u.id
                LEFT JOIN group_members gm ON g.id = gm.groupId
                LEFT JOIN group_settings gs ON g.id = gs.groupId
                WHERE g.id = ?
                GROUP BY g.id
            `;
            const [group] = await dbUtils.query(query, [groupId]);
            if (!group) throw new Error('그룹을 찾을 수 없습니다');
            return { group };
        } catch (error) {
            throw new Error('그룹 상세 정보 조회 실패: ' + error.message);
        }
    },
    // 그룹 생성
    async createGroup(data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO groups (name, description, category, createdBy)
                    VALUES (?, ?, ?, ?)
                `, [data.name, data.description, data.category, req.user.id]);

                const groupId = result.insertId;

                if (data.image) {
                    const imageUrl = await uploadImage(data.image);
                    await connection.query(
                        'UPDATE groups SET image = ? WHERE id = ?',
                        [imageUrl, groupId]
                    );
                }

                await connection.query(`
                    INSERT INTO group_members (groupId, userId, role)
                    VALUES (?, ?, 'admin')
                `, [groupId, req.user.id]);

                await connection.query(`
                    INSERT INTO group_settings (groupId)
                    VALUES (?)
                `, [groupId]);

                return { groupId };
            } catch (error) {
                throw new Error('그룹 생성 실패: ' + error.message);
            }
        });
    },

    // 그룹 목록 조회
    async getGroups() {
        try {
            const query = `
            SELECT g.*, 
                   COUNT(DISTINCT gm.userId) as memberCount,
                   CASE WHEN gm2.userId IS NOT NULL THEN true ELSE false END as isMember
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.groupId
            LEFT JOIN group_members gm2 ON g.id = gm2.groupId AND gm2.userId = ?
            WHERE g.isPublic = true
            GROUP BY g.id
            ORDER BY g.createdAt DESC
        `;
            const groups = await dbUtils.query(query, [req.user.id]);
            return { groups };
        } catch (error) {
            throw new Error('그룹 목록 조회 실패: ' + error.message);
        }
    },

    // 최근 그룹 조회
    async getRecentGroups() {
        try {
            const query = `
            SELECT g.*, 
                   COUNT(DISTINCT gm.userId) as memberCount
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.groupId
            WHERE g.isPublic = true
            GROUP BY g.id
            ORDER BY g.createdAt DESC
            LIMIT 10
        `;
            const groups = await dbUtils.query(query);
            return { groups };
        } catch (error) {
            throw new Error('최근 그룹 조회 실패: ' + error.message);
        }
    },

    // 그룹 삭제
    async deleteGroup(groupId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 그룹 멤버 삭제
                await connection.query(
                    'DELETE FROM group_members WHERE groupId = ?',
                    [groupId]
                );

                // 그룹 활동 삭제
                await connection.query(
                    'DELETE FROM group_activities WHERE groupId = ?',
                    [groupId]
                );

                // 그룹 설정 삭제
                await connection.query(
                    'DELETE FROM group_settings WHERE groupId = ?',
                    [groupId]
                );

                // 그룹 삭제
                const result = await connection.query(
                    'DELETE FROM groups WHERE id = ? AND createdBy = ?',
                    [groupId, req.user.id]
                );

                if (result.affectedRows === 0) {
                    throw new Error('그룹을 찾을 수 없거나 권한이 없습니다');
                }

                return { success: true };
            } catch (error) {
                throw new Error('그룹 삭제 실패: ' + error.message);
            }
        });
    },

    // 그룹 업데이트
    async updateGroup(groupId, data) {
        try {
            const query = `
            UPDATE groups 
            SET name = ?,
                description = ?,
                category = ?
            WHERE id = ? AND createdBy = ?
        `;

            const result = await dbUtils.query(query, [
                data.name,
                data.description,
                data.category,
                groupId,
                req.user.id
            ]);

            if (result.affectedRows === 0) {
                throw new Error('그룹을 찾을 수 없거나 권한이 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('그룹 수정 실패: ' + error.message);
        }
    },

    // 멤버 상세 정보 조회
    async getMemberDetail(groupId, memberId) {
        try {
            const query = `
            SELECT u.id, u.name, u.profileImage,
                   gm.role, gm.joinedAt,
                   COUNT(ga.id) as activityCount
            FROM group_members gm
            JOIN users u ON gm.userId = u.id
            LEFT JOIN group_activities ga ON ga.userId = u.id AND ga.groupId = gm.groupId
            WHERE gm.groupId = ? AND gm.userId = ?
            GROUP BY u.id
        `;

            const [member] = await dbUtils.query(query, [groupId, memberId]);

            if (!member) {
                throw new Error('멤버를 찾을 수 없습니다');
            }

            return { member };
        } catch (error) {
            throw new Error('멤버 상세 정보 조회 실패: ' + error.message);
        }
    },

    // 그룹 멤버 목록 조회
    async getGroupMembers(groupId) {
        try {
            const query = `
            SELECT u.id, u.name, u.profileImage,
                   gm.role, gm.joinedAt
            FROM group_members gm
            JOIN users u ON gm.userId = u.id
            WHERE gm.groupId = ?
            ORDER BY gm.role = 'admin' DESC, gm.joinedAt ASC
        `;

            const members = await dbUtils.query(query, [groupId]);
            return { members };
        } catch (error) {
            throw new Error('그룹 멤버 목록 조회 실패: ' + error.message);
        }
    },

    // 멤버 검색
    async searchMembers(groupId, searchQuery) {
        try {
            const query = `
            SELECT u.id, u.name, u.profileImage, 
                   gm.role, gm.joinedAt
            FROM group_members gm
            JOIN users u ON gm.userId = u.id
            WHERE gm.groupId = ? 
            AND u.name LIKE ?
            ORDER BY gm.role = 'admin' DESC, u.name ASC
        `;

            const members = await dbUtils.query(query, [
                groupId,
                `%${searchQuery}%`
            ]);

            return { members };
        } catch (error) {
            throw new Error('멤버 검색 실패: ' + error.message);
        }
    },

    // 가입 요청 목록 조회
    async getJoinRequests(groupId) {
        try {
            const query = `
            SELECT jr.*, u.name, u.profileImage
            FROM group_join_requests jr
            JOIN users u ON jr.userId = u.id
            WHERE jr.groupId = ? AND jr.status = 'pending'
            ORDER BY jr.createdAt DESC
        `;
            const requests = await dbUtils.query(query, [groupId]);
            return { requests };
        } catch (error) {
            throw new Error('가입 요청 목록 조회 실패: ' + error.message);
        }
    },

    // 가입 요청 처리
    async handleJoinRequest(groupId, requestId, action) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [request] = await connection.query(
                    'SELECT * FROM group_join_requests WHERE id = ? AND groupId = ?',
                    [requestId, groupId]
                );

                if (!request) {
                    throw new Error('가입 요청을 찾을 수 없습니다');
                }

                if (action === 'accept') {
                    // 멤버로 추가
                    await connection.query(`
                    INSERT INTO group_members (groupId, userId, role)
                    VALUES (?, ?, 'member')
                `, [groupId, request.userId]);

                    // 활동 기록 추가
                    await connection.query(`
                    INSERT INTO group_activities (groupId, userId, type)
                    VALUES (?, ?, 'join')
                `, [groupId, request.userId]);
                }

                // 요청 상태 업데이트
                await connection.query(
                    'UPDATE group_join_requests SET status = ? WHERE id = ?',
                    [action === 'accept' ? 'accepted' : 'rejected', requestId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('가입 요청 처리 실패: ' + error.message);
            }
        });
    },

    // 가입 가능한 멤버 조회
    async getAvailableMembers(groupId) {
        try {
            const query = `
            SELECT u.id, u.name, u.profileImage
            FROM users u
            LEFT JOIN group_members gm 
                ON u.id = gm.userId AND gm.groupId = ?
            LEFT JOIN group_join_requests jr 
                ON u.id = jr.userId AND jr.groupId = ?
            WHERE gm.id IS NULL AND jr.id IS NULL
        `;
            const members = await dbUtils.query(query, [groupId, groupId]);
            return { members };
        } catch (error) {
            throw new Error('가입 가능한 멤버 조회 실패: ' + error.message);
        }
    },

    // 다중 가입 요청 처리
    async handleBulkMemberRequests(groupId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const { requestIds, action } = data;

                for (const requestId of requestIds) {
                    await this.handleJoinRequest(groupId, requestId, action);
                }

                return { success: true };
            } catch (error) {
                throw new Error('다중 가입 요청 처리 실패: ' + error.message);
            }
        });
    },

    // 가입 요청 상세 조회
    async getMemberRequestDetail(groupId, requestId) {
        try {
            const query = `
            SELECT jr.*, 
                   u.name, u.profileImage,
                   g.name as groupName
            FROM group_join_requests jr
            JOIN users u ON jr.userId = u.id
            JOIN groups g ON jr.groupId = g.id
            WHERE jr.groupId = ? AND jr.id = ?
        `;

            const [request] = await dbUtils.query(query, [groupId, requestId]);

            if (!request) {
                throw new Error('가입 요청을 찾을 수 없습니다');
            }

            return { request };
        } catch (error) {
            throw new Error('가입 요청 상세 조회 실패: ' + error.message);
        }
    },

    // 멤버 추가
    async addGroupMember(groupId, memberId) {
        try {
            const query = `
            INSERT INTO group_members (groupId, userId, role)
            VALUES (?, ?, 'member')
        `;

            await dbUtils.query(query, [groupId, memberId]);

            // 활동 기록 추가
            await dbUtils.query(`
            INSERT INTO group_activities (groupId, userId, type)
            VALUES (?, ?, 'join')
        `, [groupId, memberId]);

            return { success: true };
        } catch (error) {
            throw new Error('멤버 추가 실패: ' + error.message);
        }
    },

    // 멤버 초대
    async inviteMembers(groupId, userIds) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 그룹 설정 확인
                const [settings] = await connection.query(
                    'SELECT allowInvites FROM group_settings WHERE groupId = ?',
                    [groupId]
                );

                if (!settings.allowInvites) {
                    throw new Error('초대가 비활성화되어 있습니다');
                }

                // 각 사용자에 대해 초대 생성
                for (const userId of userIds) {
                    await connection.query(`
                    INSERT INTO group_join_requests (groupId, userId, status)
                    VALUES (?, ?, 'pending')
                    ON DUPLICATE KEY UPDATE status = 'pending'
                `, [groupId, userId]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('멤버 초대 실패: ' + error.message);
            }
        });
    },

    // 초대 코드 생성
    async createInvitation(groupId) {
        try {
            const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

            await dbUtils.query(`
            INSERT INTO group_invitations (groupId, code, expiresAt)
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
        `, [groupId, inviteCode]);

            return {
                success: true,
                inviteCode
            };
        } catch (error) {
            throw new Error('초대 코드 생성 실패: ' + error.message);
        }
    },

    // 멤버 제거
    async removeMember(groupId, memberId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 관리자 권한 확인
                const [adminCheck] = await connection.query(`
                SELECT role FROM group_members 
                WHERE groupId = ? AND userId = ?
            `, [groupId, req.user.id]);

                if (!adminCheck || adminCheck.role !== 'admin') {
                    throw new Error('멤버 제거 권한이 없습니다');
                }

                // 멤버 제거
                await connection.query(
                    'DELETE FROM group_members WHERE groupId = ? AND userId = ?',
                    [groupId, memberId]
                );

                // 활동 기록 추가
                await connection.query(`
                INSERT INTO group_activities (groupId, userId, type)
                VALUES (?, ?, 'leave')
            `, [groupId, memberId]);

                return { success: true };
            } catch (error) {
                throw new Error('멤버 제거 실패: ' + error.message);
            }
        });
    },

    // 멤버 역할 업데이트
    async updateMemberRole(groupId, memberId, role) {
        try {
            const query = `
            UPDATE group_members
            SET role = ?
            WHERE groupId = ? AND userId = ?
        `;

            const result = await dbUtils.query(query, [role, groupId, memberId]);

            if (result.affectedRows === 0) {
                throw new Error('멤버를 찾을 수 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('멤버 역할 업데이트 실패: ' + error.message);
        }
    },

    // 그룹 설정 조회
    async getGroupSettings(groupId) {
        try {
            const query = `
            SELECT gs.*,
                   g.name as groupName,
                   g.isPublic
            FROM group_settings gs
            JOIN groups g ON gs.groupId = g.id
            WHERE gs.groupId = ?
        `;

            const [settings] = await dbUtils.query(query, [groupId]);

            if (!settings) {
                throw new Error('그룹 설정을 찾을 수 없습니다');
            }

            return { settings };
        } catch (error) {
            throw new Error('그룹 설정 조회 실패: ' + error.message);
        }
    },

    // 그룹 설정 업데이트
    async updateGroupSettings(groupId, data) {
        try {
            // 관리자 권한 확인
            const [adminCheck] = await dbUtils.query(
                'SELECT role FROM group_members WHERE groupId = ? AND userId = ?',
                [groupId, req.user.id]
            );

            if (!adminCheck || adminCheck.role !== 'admin') {
                throw new Error('설정 변경 권한이 없습니다');
            }

            const query = `
            UPDATE group_settings
            SET joinApproval = ?,
                postApproval = ?,
                allowInvites = ?,
                visibility = ?
            WHERE groupId = ?
        `;

            await dbUtils.query(query, [
                data.joinApproval,
                data.postApproval,
                data.allowInvites,
                data.visibility,
                groupId
            ]);

            return { success: true };
        } catch (error) {
            throw new Error('그룹 설정 업데이트 실패: ' + error.message);
        }
    },

    // 그룹 이미지 업로드
    async uploadGroupImage(groupId, file) {
        try {
            // 이미지 업로드 처리
            const imageUrl = await uploadImage(file); // 실제 이미지 업로드 함수 구현 필요

            // 기존 이미지 삭제
            const [group] = await dbUtils.query(
                'SELECT image FROM groups WHERE id = ?',
                [groupId]
            );

            if (group.image) {
                await deleteImage(group.image); // 기존 이미지 삭제 함수 구현 필요
            }

            // 새 이미지 URL 저장
            await dbUtils.query(
                'UPDATE groups SET image = ? WHERE id = ?',
                [imageUrl, groupId]
            );

            return {
                success: true,
                imageUrl
            };
        } catch (error) {
            throw new Error('그룹 이미지 업로드 실패: ' + error.message);
        }
    },

    // 그룹 참여
    async joinGroup(groupId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 그룹 설정 확인
                const [settings] = await connection.query(
                    'SELECT joinApproval FROM group_settings WHERE groupId = ?',
                    [groupId]
                );

                if (settings.joinApproval) {
                    // 승인이 필요한 경우 요청 생성
                    await connection.query(`
                    INSERT INTO group_join_requests (groupId, userId, status)
                    VALUES (?, ?, 'pending')
                `, [groupId, req.user.id]);

                    return {
                        success: true,
                        status: 'pending'
                    };
                } else {
                    // 바로 멤버로 추가
                    await connection.query(`
                    INSERT INTO group_members (groupId, userId, role)
                    VALUES (?, ?, 'member')
                `, [groupId, req.user.id]);

                    await connection.query(`
                    INSERT INTO group_activities (groupId, userId, type)
                    VALUES (?, ?, 'join')
                `, [groupId, req.user.id]);

                    return {
                        success: true,
                        status: 'joined'
                    };
                }
            } catch (error) {
                throw new Error('그룹 참여 실패: ' + error.message);
            }
        });
    },

    // 그룹 나가기
    async leaveGroup(groupId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 관리자 확인
                const [memberCheck] = await connection.query(`
                SELECT role FROM group_members 
                WHERE groupId = ? AND userId = ?
            `, [groupId, req.user.id]);

                if (memberCheck.role === 'admin') {
                    // 다른 관리자가 있는지 확인
                    const [otherAdmin] = await connection.query(`
                    SELECT userId FROM group_members 
                    WHERE groupId = ? AND role = 'admin' AND userId != ?
                    LIMIT 1
                `, [groupId, req.user.id]);

                    if (!otherAdmin) {
                        throw new Error('다른 관리자를 지정해야 합니다');
                    }
                }

                // 멤버 제거
                await connection.query(
                    'DELETE FROM group_members WHERE groupId = ? AND userId = ?',
                    [groupId, req.user.id]
                );

                // 활동 기록 추가
                await connection.query(`
                INSERT INTO group_activities (groupId, userId, type)
                VALUES (?, ?, 'leave')
            `, [groupId, req.user.id]);

                return { success: true };
            } catch (error) {
                throw new Error('그룹 나가기 실패: ' + error.message);
            }
        });
    },

    // 피드 액션 처리
    async handleFeedAction(groupId, feedId, actionType) {
        try {
            // 멤버 확인
            const [memberCheck] = await dbUtils.query(
                'SELECT id FROM group_members WHERE groupId = ? AND userId = ?',
                [groupId, req.user.id]
            );

            if (!memberCheck) {
                throw new Error('그룹 멤버만 액션을 수행할 수 있습니다');
            }

            // 액션 기록
            await dbUtils.query(`
            INSERT INTO group_activities (groupId, userId, type, content)
            VALUES (?, ?, ?, ?)
        `, [groupId, req.user.id, actionType, feedId]);

            // 액션별 추가 처리
            switch(actionType) {
                case 'like':
                    await dbUtils.query(`
                    INSERT INTO feed_likes (feedId, userId)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE createdAt = NOW()
                `, [feedId, req.user.id]);
                    break;
                case 'comment':
                    // 댓글 처리는 별도 API에서 처리
                    break;
            }

            return { success: true };
        } catch (error) {
            throw new Error('피드 액션 처리 실패: ' + error.message);
        }
    },

};

module.exports = groupService;
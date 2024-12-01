const { dbUtils } = require('../config/db');

const friendsService = {
    // 친구 목록 조회
    async getFriends(params) {
        try {
            const query = `
                SELECT f.*, u.name, u.profileImage
                FROM friends f
                         JOIN users u ON f.friendId = u.id
                WHERE f.userId = ? AND f.isBlocked = false
                ORDER BY f.group, u.name
            `;
            const friends = await dbUtils.query(query, [req.user.id]);
            return { friends };
        } catch (error) {
            throw new Error('친구 목록 조회 실패: ' + error.message);
        }
    },

    // 친구 검색
    async searchFriends(query) {
        try {
            const searchQuery = `
                SELECT u.id, u.name, u.profileImage,
                       CASE WHEN f.id IS NOT NULL THEN true ELSE false END as isFriend
                FROM users u
                         LEFT JOIN friends f ON u.id = f.friendId AND f.userId = ?
                WHERE u.id != ? AND u.name LIKE ?
                LIMIT 20
            `;
            const friends = await dbUtils.query(searchQuery, [
                req.user.id,
                req.user.id,
                `%${query}%`
            ]);
            return { friends };
        } catch (error) {
            throw new Error('친구 검색 실패: ' + error.message);
        }
    },

    // 친구 그룹 목록 조회
    async getGroups() {
        try {
            const query = `
                SELECT * FROM friend_groups
                WHERE userId = ?
                ORDER BY \`order\`
            `;
            const groups = await dbUtils.query(query, [req.user.id]);
            return { groups };
        } catch (error) {
            throw new Error('친구 그룹 목록 조회 실패: ' + error.message);
        }
    },

    // 친구 추가
    async addFriend(friendId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(`
                    INSERT INTO friends (userId, friendId)
                    VALUES (?, ?), (?, ?)
                `, [req.user.id, friendId, friendId, req.user.id]);

                return { success: true };
            } catch (error) {
                throw new Error('친구 추가 실패: ' + error.message);
            }
        });
    },

    // 친구 삭제
    async removeFriend(friendId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(`
                    DELETE FROM friends
                    WHERE (userId = ? AND friendId = ?)
                       OR (userId = ? AND friendId = ?)
                `, [req.user.id, friendId, friendId, req.user.id]);

                return { success: true };
            } catch (error) {
                throw new Error('친구 삭제 실패: ' + error.message);
            }
        });
    },

    // 친구 그룹 변경
    async updateFriendGroup(friendId, group) {
        try {
            await dbUtils.query(`
                UPDATE friends
                SET \`group\` = ?
                WHERE userId = ? AND friendId = ?
            `, [group, req.user.id, friendId]);

            return { success: true };
        } catch (error) {
            throw new Error('친구 그룹 변경 실패: ' + error.message);
        }
    },

    // 친구 요청 목록 조회
    async getFriendRequests() {
        try {
            const query = `
                SELECT fr.*, u.name, u.profileImage
                FROM friend_requests fr
                         JOIN users u ON fr.senderId = u.id
                WHERE fr.receiverId = ? AND fr.status = 'pending'
                ORDER BY fr.createdAt DESC
            `;
            const requests = await dbUtils.query(query, [req.user.id]);
            return { requests };
        } catch (error) {
            throw new Error('친구 요청 목록 조회 실패: ' + error.message);
        }
    },

    // 친구 요청 수락
    async acceptFriendRequest(requestId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [request] = await connection.query(
                    'SELECT * FROM friend_requests WHERE id = ?',
                    [requestId]
                );

                if (!request) {
                    throw new Error('친구 요청을 찾을 수 없습니다');
                }

                await connection.query(`
                    INSERT INTO friends (userId, friendId)
                    VALUES (?, ?), (?, ?)
                `, [
                    request.senderId, request.receiverId,
                    request.receiverId, request.senderId
                ]);

                await connection.query(`
                    UPDATE friend_requests
                    SET status = 'accepted'
                    WHERE id = ?
                `, [requestId]);

                return { success: true };
            } catch (error) {
                throw new Error('친구 요청 수락 실패: ' + error.message);
            }
        });
    },

    // rejectFriendRequest 구현
    async rejectFriendRequest(requestId) {
        try {
            const [request] = await dbUtils.query(
                'SELECT * FROM friend_requests WHERE id = ? AND receiverId = ?',
                [requestId, req.user.id]
            );

            if (!request) {
                throw new Error('친구 요청을 찾을 수 없습니다');
            }

            await dbUtils.query(
                'UPDATE friend_requests SET status = ? WHERE id = ?',
                ['rejected', requestId]
            );

            return { success: true };
        } catch (error) {
            throw new Error('친구 요청 거절 실패: ' + error.message);
        }
    },

    // sendFriendRequest 구현
    async sendFriendRequest(targetUserId) {
        try {
            // 이미 친구인지 확인
            const [existingFriend] = await dbUtils.query(
                'SELECT * FROM friends WHERE userId = ? AND friendId = ?',
                [req.user.id, targetUserId]
            );

            if (existingFriend) {
                throw new Error('이미 친구입니다');
            }

            // 이미 보낸 요청이 있는지 확인
            const [existingRequest] = await dbUtils.query(
                'SELECT * FROM friend_requests WHERE senderId = ? AND receiverId = ? AND status = "pending"',
                [req.user.id, targetUserId]
            );

            if (existingRequest) {
                throw new Error('이미 친구 요청을 보냈습니다');
            }

            await dbUtils.query(
                'INSERT INTO friend_requests (senderId, receiverId, status) VALUES (?, ?, "pending")',
                [req.user.id, targetUserId]
            );

            return { success: true };
        } catch (error) {
            throw new Error('친구 요청 전송 실패: ' + error.message);
        }
    },

    // getFriendSettings 구현
    async getFriendSettings() {
        try {
            const [settings] = await dbUtils.query(
                'SELECT * FROM friend_settings WHERE userId = ?',
                [req.user.id]
            );

            if (!settings) {
                // 기본 설정 생성
                await dbUtils.query(
                    'INSERT INTO friend_settings (userId) VALUES (?)',
                    [req.user.id]
                );
                return {
                    allowFriendRequests: true,
                    showOnlineStatus: true,
                    autoAcceptRequests: false,
                    notifyNewRequests: true
                };
            }

            return settings;
        } catch (error) {
            throw new Error('친구 설정 조회 실패: ' + error.message);
        }
    },

    // updateFriendSettings 구현
    async updateFriendSettings(data) {
        try {
            await dbUtils.query(`
                UPDATE friend_settings
                SET allowFriendRequests = ?,
                    showOnlineStatus = ?,
                    autoAcceptRequests = ?,
                    notifyNewRequests = ?
                WHERE userId = ?
            `, [
                data.allowFriendRequests,
                data.showOnlineStatus,
                data.autoAcceptRequests,
                data.notifyNewRequests,
                req.user.id
            ]);

            return { success: true };
        } catch (error) {
            throw new Error('친구 설정 업데이트 실패: ' + error.message);
        }
    },

    // getFriendProfile 구현
    async getFriendProfile(friendId) {
        try {
            // 친구 관계 확인
            const [friendship] = await dbUtils.query(`
                SELECT * FROM friends
                WHERE userId = ? AND friendId = ?
            `, [req.user.id, friendId]);

            if (!friendship) {
                throw new Error('친구가 아닙니다');
            }

            // 프로필 정보 조회
            const [profile] = await dbUtils.query(`
                SELECT u.id, u.name, u.email, u.profileImage,
                       f.isBlocked, f.isHidden,
                       COUNT(DISTINCT g.id) as commonGroupCount
                FROM users u
                         LEFT JOIN friends f ON u.id = f.friendId AND f.userId = ?
                         LEFT JOIN group_members gm1 ON u.id = gm1.userId
                         LEFT JOIN group_members gm2 ON gm1.groupId = gm2.groupId AND gm2.userId = ?
                         LEFT JOIN groups g ON gm1.groupId = g.id
                WHERE u.id = ?
                GROUP BY u.id
            `, [req.user.id, req.user.id, friendId]);

            if (!profile) {
                throw new Error('프로필을 찾을 수 없습니다');
            }

            return { friend: profile };
        } catch (error) {
            throw new Error('친구 프로필 조회 실패: ' + error.message);
        }
    },

    // toggleBlock 구현
    async toggleBlock(friendId) {
        try {
            const [friendship] = await dbUtils.query(
                'SELECT isBlocked FROM friends WHERE userId = ? AND friendId = ?',
                [req.user.id, friendId]
            );

            if (!friendship) {
                throw new Error('친구 관계가 존재하지 않습니다');
            }

            const newBlockStatus = !friendship.isBlocked;
            await dbUtils.query(
                'UPDATE friends SET isBlocked = ? WHERE userId = ? AND friendId = ?',
                [newBlockStatus, req.user.id, friendId]
            );

            return {
                success: true,
                isBlocked: newBlockStatus
            };
        } catch (error) {
            throw new Error('친구 차단 상태 변경 실패: ' + error.message);
        }
    },

// toggleHide 구현
    async toggleHide(friendId) {
        try {
            const [friendship] = await dbUtils.query(
                'SELECT isHidden FROM friends WHERE userId = ? AND friendId = ?',
                [req.user.id, friendId]
            );

            if (!friendship) {
                throw new Error('친구 관계가 존재하지 않습니다');
            }

            const newHideStatus = !friendship.isHidden;
            await dbUtils.query(
                'UPDATE friends SET isHidden = ? WHERE userId = ? AND friendId = ?',
                [newHideStatus, req.user.id, friendId]
            );

            return {
                success: true,
                isHidden: newHideStatus
            };
        } catch (error) {
            throw new Error('친구 숨김 상태 변경 실패: ' + error.message);
        }
    },

// startChat 구현
    async startChat(friendId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 1:1 채팅방 확인
                const [existingChat] = await connection.query(`
                    SELECT cr.id
                    FROM chat_rooms cr
                             JOIN chat_room_participants crp1 ON cr.id = crp1.roomId
                             JOIN chat_room_participants crp2 ON cr.id = crp2.roomId
                    WHERE cr.type = 'individual'
                      AND crp1.userId = ?
                      AND crp2.userId = ?
                `, [req.user.id, friendId]);

                if (existingChat) {
                    return { roomId: existingChat.id };
                }

                // 새 채팅방 생성
                const [result] = await connection.query(`
                    INSERT INTO chat_rooms (type) VALUES ('individual')
                `);

                const roomId = result.insertId;

                // 참여자 추가
                await connection.query(`
                    INSERT INTO chat_room_participants (roomId, userId)
                    VALUES (?, ?), (?, ?)
                `, [roomId, req.user.id, roomId, friendId]);

                return { roomId };
            } catch (error) {
                throw new Error('채팅방 생성 실패: ' + error.message);
            }
        });
    },

// getCommonGroups 구현
    async getCommonGroups(friendId) {
        try {
            const query = `
                SELECT g.*
                FROM groups g
                         JOIN group_members gm1 ON g.id = gm1.groupId
                         JOIN group_members gm2 ON g.id = gm2.groupId
                WHERE gm1.userId = ?
                  AND gm2.userId = ?
                  AND g.status = 'active'
            `;

            const groups = await dbUtils.query(query, [req.user.id, friendId]);
            return { groups };
        } catch (error) {
            throw new Error('공통 그룹 조회 실패: ' + error.message);
        }
    }
};

module.exports = friendsService;
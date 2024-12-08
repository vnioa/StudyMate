const { dbUtils } = require('../config/database.config');

const friendsService = {
    // 친구 목록 조회
    async getFriends(userId, group) {
        try {
            let query = `
                SELECT f.*, a.username, a.name, a.profileImage,
                       a.lastLogin, fs.showOnlineStatus
                FROM friends f
                JOIN auth a ON f.friendId = a.id
                LEFT JOIN friend_settings fs ON f.memberId = fs.memberId
                WHERE f.memberId = ? AND f.isHidden = false
            `;

            const params = [userId];
            if (group) {
                query += ' AND f.group = ?';
                params.push(group);
            }

            return await dbUtils.query(query, params);
        } catch (error) {
            throw new Error('친구 목록 조회 실패: ' + error.message);
        }
    },

    // 친구 검색
    async searchFriends(userId, searchQuery) {
        try {
            const query = `
                SELECT f.*, a.username, a.name, a.profileImage
                FROM friends f
                JOIN auth a ON f.friendId = a.id
                WHERE f.memberId = ? 
                AND f.isHidden = false
                AND (a.username LIKE ? OR a.name LIKE ?)
            `;

            return await dbUtils.query(query, [
                userId,
                `%${searchQuery}%`,
                `%${searchQuery}%`
            ]);
        } catch (error) {
            throw new Error('친구 검색 실패: ' + error.message);
        }
    },

    // 친구 그룹 목록 조회
    async getFriendGroups(userId) {
        try {
            const query = `
                SELECT fg.*, COUNT(f.id) as friendCount
                FROM friend_groups fg
                LEFT JOIN friends f ON fg.name = f.group AND f.memberId = fg.memberId
                WHERE fg.memberId = ?
                GROUP BY fg.id
                ORDER BY fg.order ASC
            `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('친구 그룹 목록 조회 실패: ' + error.message);
        }
    },

    // 친구 추가
    async addFriend(userId, friendId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [existingFriend] = await connection.query(
                    'SELECT id FROM friends WHERE memberId = ? AND friendId = ?',
                    [userId, friendId]
                );

                if (existingFriend) {
                    throw new Error('이미 친구로 등록된 사용자입니다.');
                }

                await connection.query(`
                    INSERT INTO friends (memberId, friendId, createdAt)
                    VALUES (?, ?, NOW()), (?, ?, NOW())
                `, [userId, friendId, friendId, userId]);

                const [friend] = await connection.query(`
                    SELECT f.*, a.username, a.name
                    FROM friends f
                    JOIN auth a ON f.friendId = a.id
                    WHERE f.memberId = ? AND f.friendId = ?
                `, [userId, friendId]);

                return friend;
            } catch (error) {
                throw new Error('친구 추가 실패: ' + error.message);
            }
        });
    },

    // 친구 삭제
    async removeFriend(userId, friendId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(`
                    DELETE FROM friends 
                    WHERE (memberId = ? AND friendId = ?) 
                    OR (memberId = ? AND friendId = ?)
                `, [userId, friendId, friendId, userId]);
            } catch (error) {
                throw new Error('친구 삭제 실패: ' + error.message);
            }
        });
    },

    // 친구 그룹 변경
    async updateFriendGroup(userId, friendId, group) {
        try {
            const result = await dbUtils.query(`
                UPDATE friends
                SET \`group\` = ?
                WHERE memberId = ? AND friendId = ?
            `, [group, userId, friendId]);

            if (result.affectedRows === 0) {
                throw new Error('친구를 찾을 수 없습니다.');
            }

            return { success: true };
        } catch (error) {
            throw new Error('친구 그룹 변경 실패: ' + error.message);
        }
    },

    // 친구 요청 목록 조회
    async getFriendRequests(userId) {
        try {
            const query = `
                SELECT fr.*, a.username, a.name, a.profileImage
                FROM friend_requests fr
                JOIN auth a ON fr.memberId = a.id
                WHERE fr.friendId = ? AND fr.status = 'pending'
                ORDER BY fr.createdAt DESC
            `;

            return await dbUtils.query(query, [userId]);
        } catch (error) {
            throw new Error('친구 요청 목록 조회 실패: ' + error.message);
        }
    },

    // 친구 요청 수락
    async acceptFriendRequest(userId, requestId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [request] = await connection.query(
                    'SELECT * FROM friend_requests WHERE id = ? AND friendId = ? AND status = "pending"',
                    [requestId, userId]
                );

                if (!request) {
                    throw new Error('유효하지 않은 친구 요청입니다.');
                }

                await connection.query(
                    'UPDATE friend_requests SET status = "accepted" WHERE id = ?',
                    [requestId]
                );

                await this.addFriend(userId, request.memberId);
            } catch (error) {
                throw new Error('친구 요청 수락 실패: ' + error.message);
            }
        });
    },

    // 친구 요청 거절
    async rejectFriendRequest(userId, requestId) {
        try {
            const result = await dbUtils.query(`
                UPDATE friend_requests 
                SET status = 'rejected'
                WHERE id = ? AND friendId = ? AND status = 'pending'
            `, [requestId, userId]);

            if (result.affectedRows === 0) {
                throw new Error('유효하지 않은 친구 요청입니다.');
            }
        } catch (error) {
            throw new Error('친구 요청 거절 실패: ' + error.message);
        }
    },

    // 친구 설정 조회
    async getFriendSettings(userId) {
        try {
            const [settings] = await dbUtils.query(
                'SELECT * FROM friend_settings WHERE memberId = ?',
                [userId]
            );

            return settings || {
                allowFriendRequests: true,
                showOnlineStatus: true,
                autoAcceptRequests: false,
                notifyNewRequests: true
            };
        } catch (error) {
            throw new Error('친구 설정 조회 실패: ' + error.message);
        }
    },

    // 친구 설정 업데이트
    async updateFriendSettings(userId, settings) {
        try {
            await dbUtils.query(`
                INSERT INTO friend_settings (memberId, allowFriendRequests, showOnlineStatus, 
                    autoAcceptRequests, notifyNewRequests)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    allowFriendRequests = VALUES(allowFriendRequests),
                    showOnlineStatus = VALUES(showOnlineStatus),
                    autoAcceptRequests = VALUES(autoAcceptRequests),
                    notifyNewRequests = VALUES(notifyNewRequests)
            `, [
                userId,
                settings.allowFriendRequests,
                settings.showOnlineStatus,
                settings.autoAcceptRequests,
                settings.notifyNewRequests
            ]);

            return settings;
        } catch (error) {
            throw new Error('친구 설정 업데이트 실패: ' + error.message);
        }
    },

    // 친구 요청 보내기
    async sendFriendRequest(userId, targetId, message) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 이미 친구인지 확인
                const [existingFriend] = await connection.query(
                    'SELECT id FROM friends WHERE memberId = ? AND friendId = ?',
                    [userId, targetId]
                );

                if (existingFriend) {
                    throw new Error('이미 친구로 등록된 사용자입니다.');
                }

                // 이미 보낸 요청이 있는지 확인
                const [existingRequest] = await connection.query(`
                SELECT id FROM friend_requests 
                WHERE memberId = ? AND friendId = ? AND status = 'pending'
            `, [userId, targetId]);

                if (existingRequest) {
                    throw new Error('이미 친구 요청을 보냈습니다.');
                }

                const [result] = await connection.query(`
                INSERT INTO friend_requests (
                    memberId, friendId, message, status, createdAt
                ) VALUES (?, ?, ?, 'pending', NOW())
            `, [userId, targetId, message]);

                return { id: result.insertId, message };
            } catch (error) {
                throw new Error('친구 요청 보내기 실패: ' + error.message);
            }
        });
    },

// 친구 프로필 조회
    async getFriendProfile(userId, friendId) {
        try {
            const query = `
            SELECT a.id, a.username, a.name, a.profileImage,
                   a.lastLogin, fs.showOnlineStatus,
                   f.group, f.isBlocked, f.isHidden
            FROM auth a
            JOIN friends f ON a.id = f.friendId
            LEFT JOIN friend_settings fs ON f.memberId = fs.memberId
            WHERE f.memberId = ? AND f.friendId = ?
        `;

            const [profile] = await dbUtils.query(query, [userId, friendId]);
            if (!profile) {
                throw new Error('친구를 찾을 수 없습니다.');
            }

            return profile;
        } catch (error) {
            throw new Error('친구 프로필 조회 실패: ' + error.message);
        }
    },

// 친구 차단/차단해제
    async toggleFriendBlock(userId, friendId) {
        try {
            const [friend] = await dbUtils.query(
                'SELECT isBlocked FROM friends WHERE memberId = ? AND friendId = ?',
                [userId, friendId]
            );

            if (!friend) {
                throw new Error('친구를 찾을 수 없습니다.');
            }

            const newBlockStatus = !friend.isBlocked;
            await dbUtils.query(`
            UPDATE friends 
            SET isBlocked = ?, updatedAt = NOW()
            WHERE memberId = ? AND friendId = ?
        `, [newBlockStatus, userId, friendId]);

            return { isBlocked: newBlockStatus };
        } catch (error) {
            throw new Error('친구 차단 상태 변경 실패: ' + error.message);
        }
    },

// 친구 숨김/숨김해제
    async toggleFriendHide(userId, friendId) {
        try {
            const [friend] = await dbUtils.query(
                'SELECT isHidden FROM friends WHERE memberId = ? AND friendId = ?',
                [userId, friendId]
            );

            if (!friend) {
                throw new Error('친구를 찾을 수 없습니다.');
            }

            const newHideStatus = !friend.isHidden;
            await dbUtils.query(`
            UPDATE friends 
            SET isHidden = ?, updatedAt = NOW()
            WHERE memberId = ? AND friendId = ?
        `, [newHideStatus, userId, friendId]);

            return { isHidden: newHideStatus };
        } catch (error) {
            throw new Error('친구 숨김 상태 변경 실패: ' + error.message);
        }
    },

// 친구와 채팅 시작
    async startFriendChat(userId, friendId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 채팅방 확인
                const [existingChat] = await connection.query(`
                SELECT cr.* 
                FROM chat_rooms cr
                JOIN chat_room_participants crp1 ON cr.id = crp1.roomId
                JOIN chat_room_participants crp2 ON cr.id = crp2.roomId
                WHERE cr.type = 'individual'
                AND crp1.memberId = ? AND crp2.memberId = ?
            `, [userId, friendId]);

                if (existingChat) {
                    return existingChat;
                }

                // 새 채팅방 생성
                const [result] = await connection.query(`
                INSERT INTO chat_rooms (type, createdAt)
                VALUES ('individual', NOW())
            `);

                const roomId = result.insertId;

                // 참여자 추가
                await connection.query(`
                INSERT INTO chat_room_participants (roomId, memberId, role)
                VALUES (?, ?, 'member'), (?, ?, 'member')
            `, [roomId, userId, roomId, friendId]);

                return { id: roomId, type: 'individual' };
            } catch (error) {
                throw new Error('채팅 시작 실패: ' + error.message);
            }
        });
    },

// 공통 그룹 조회
    async getCommonGroups(userId, friendId) {
        try {
            const query = `
            SELECT DISTINCT sg.*
            FROM study_groups sg
            JOIN study_group_members sgm1 ON sg.id = sgm1.groupId
            JOIN study_group_members sgm2 ON sg.id = sgm2.groupId
            WHERE sgm1.memberId = ? AND sgm2.memberId = ?
            AND sg.status = 'active'
            ORDER BY sg.name
        `;

            return await dbUtils.query(query, [userId, friendId]);
        } catch (error) {
            throw new Error('공통 그룹 조회 실패: ' + error.message);
        }
    }
};

module.exports = friendsService;
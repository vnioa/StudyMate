const { dbUtils } = require('../config/database.config');

const chatService = {
    // 읽지 않은 메시지 수 조회
    async getUnreadMessageCount(userId) {
        try {
            const query = `
                SELECT COUNT(*) as unreadCount
                FROM messages m
                JOIN chat_room_participants crp ON m.roomId = crp.roomId
                WHERE crp.memberId = ?
                AND (m.id > crp.lastReadMessageId OR crp.lastReadMessageId IS NULL)
                AND m.senderId != ?
            `;

            const [result] = await dbUtils.query(query, [userId, userId]);
            return result.unreadCount;
        } catch (error) {
            throw new Error('읽지 않은 메시지 수 조회 실패: ' + error.message);
        }
    },

    // 채팅방 생성
    async createChatRoom(roomData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO chat_rooms (type, name)
                    VALUES (?, ?)
                `, [roomData.type, roomData.name]);

                const roomId = result.insertId;
                const participantValues = roomData.participants.map(memberId => [
                    roomId,
                    memberId,
                    memberId === roomData.createdBy ? 'admin' : 'member'
                ]);

                await connection.query(`
                    INSERT INTO chat_room_participants (roomId, memberId, role)
                    VALUES ?
                `, [participantValues]);

                return { id: roomId, ...roomData };
            } catch (error) {
                throw new Error('채팅방 생성 실패: ' + error.message);
            }
        });
    },

    // 채팅방 목록 조회
    async getChatRooms(userId) {
        try {
            const query = `
                SELECT cr.*, 
                       m.content as lastMessageContent,
                       m.createdAt as lastMessageTime,
                       COUNT(CASE WHEN m2.isRead = false AND m2.senderId != ? THEN 1 END) as unreadCount
                FROM chat_rooms cr
                JOIN chat_room_participants crp ON cr.id = crp.roomId
                LEFT JOIN messages m ON cr.lastMessageAt = m.createdAt AND cr.id = m.roomId
                LEFT JOIN messages m2 ON cr.id = m2.roomId AND m2.id > COALESCE(crp.lastReadMessageId, 0)
                WHERE crp.memberId = ?
                GROUP BY cr.id
                ORDER BY cr.isPinned DESC, cr.lastMessageAt DESC
            `;

            return await dbUtils.query(query, [userId, userId]);
        } catch (error) {
            throw new Error('채팅방 목록 조회 실패: ' + error.message);
        }
    },

    // 채팅방 검색
    async searchChatRooms(userId, searchQuery) {
        try {
            const query = `
                SELECT cr.*
                FROM chat_rooms cr
                JOIN chat_room_participants crp ON cr.id = crp.roomId
                WHERE crp.memberId = ?
                AND cr.name LIKE ?
                ORDER BY cr.lastMessageAt DESC
            `;

            return await dbUtils.query(query, [userId, `%${searchQuery}%`]);
        } catch (error) {
            throw new Error('채팅방 검색 실패: ' + error.message);
        }
    },

    // 메시지 전송
    async sendMessage(messageData) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [result] = await connection.query(`
                    INSERT INTO messages (roomId, senderId, content, type)
                    VALUES (?, ?, ?, ?)
                `, [
                    messageData.roomId,
                    messageData.senderId,
                    messageData.content,
                    messageData.type || 'text'
                ]);

                await connection.query(`
                    UPDATE chat_rooms
                    SET lastMessageAt = NOW()
                    WHERE id = ?
                `, [messageData.roomId]);

                return { id: result.insertId, ...messageData };
            } catch (error) {
                throw new Error('메시지 전송 실패: ' + error.message);
            }
        });
    },

    // 메시지 읽음 처리
    async markMessageAsRead(roomId, messageId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(`
                    UPDATE chat_room_participants
                    SET lastReadMessageId = ?
                    WHERE roomId = ? AND memberId = ?
                `, [messageId, roomId, userId]);

                await connection.query(`
                    UPDATE messages
                    SET isRead = true, readAt = NOW()
                    WHERE roomId = ? AND id <= ? AND senderId != ?
                `, [roomId, messageId, userId]);

                return { success: true };
            } catch (error) {
                throw new Error('메시지 읽음 처리 실패: ' + error.message);
            }
        });
    },

    // 채팅방 나가기
    async leaveChatRoom(roomId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(`
                    DELETE FROM chat_room_participants
                    WHERE roomId = ? AND memberId = ?
                `, [roomId, userId]);

                const [participants] = await connection.query(`
                    SELECT COUNT(*) as count
                    FROM chat_room_participants
                    WHERE roomId = ?
                `, [roomId]);

                if (participants.count === 0) {
                    await connection.query(`
                        UPDATE chat_rooms
                        SET deletedAt = NOW()
                        WHERE id = ?
                    `, [roomId]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('채팅방 나가기 실패: ' + error.message);
            }
        });
    },

    // 채팅방 상세 조회
    async getChatRoomDetail(roomId, userId) {
        try {
            const query = `
            SELECT cr.*, m.content as lastMessageContent,
                   COUNT(DISTINCT msg.id) as messageCount,
                   crp.role as userRole
            FROM chat_rooms cr
            JOIN chat_room_participants crp ON cr.id = crp.roomId
            LEFT JOIN messages m ON cr.lastMessageAt = m.createdAt AND cr.id = m.roomId
            LEFT JOIN messages msg ON cr.id = msg.roomId
            WHERE cr.id = ? AND crp.memberId = ?
            GROUP BY cr.id
        `;

            const [room] = await dbUtils.query(query, [roomId, userId]);
            if (!room) {
                throw new Error('채팅방을 찾을 수 없거나 접근 권한이 없습니다.');
            }
            return room;
        } catch (error) {
            throw new Error('채팅방 상세 조회 실패: ' + error.message);
        }
    },

// 채팅방 설정 조회
    async getRoomSettings(roomId, userId) {
        try {
            const query = `
            SELECT cr.notification, cr.encryption, cr.theme, cr.name,
                   crp.role as userRole
            FROM chat_rooms cr
            JOIN chat_room_participants crp ON cr.id = crp.roomId
            WHERE cr.id = ? AND crp.memberId = ?
        `;

            const [settings] = await dbUtils.query(query, [roomId, userId]);
            if (!settings) {
                throw new Error('채팅방 설정을 찾을 수 없습니다.');
            }
            return settings;
        } catch (error) {
            throw new Error('채팅방 설정 조회 실패: ' + error.message);
        }
    },

// 채팅방 설정 업데이트
    async updateRoomSettings(roomId, userId, settings) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [participant] = await connection.query(
                    'SELECT role FROM chat_room_participants WHERE roomId = ? AND memberId = ?',
                    [roomId, userId]
                );

                if (!participant || participant.role !== 'admin') {
                    throw new Error('설정 변경 권한이 없습니다.');
                }

                await connection.query(`
                UPDATE chat_rooms
                SET notification = ?,
                    encryption = ?,
                    theme = ?,
                    name = ?
                WHERE id = ?
            `, [
                    settings.notification,
                    settings.encryption,
                    settings.theme,
                    settings.name,
                    roomId
                ]);

                return { success: true, ...settings };
            } catch (error) {
                throw new Error('채팅방 설정 업데이트 실패: ' + error.message);
            }
        });
    },

// 이미지 메시지 전송
    async sendImageMessage(roomId, userId, image) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 이미지 업로드 로직 구현 필요
                const imageUrl = await this.uploadImage(image);

                const [result] = await connection.query(`
                INSERT INTO messages (roomId, senderId, content, type)
                VALUES (?, ?, ?, 'image')
            `, [roomId, userId, imageUrl]);

                await connection.query(`
                UPDATE chat_rooms
                SET lastMessageAt = NOW()
                WHERE id = ?
            `, [roomId]);

                return { id: result.insertId, imageUrl };
            } catch (error) {
                throw new Error('이미지 메시지 전송 실패: ' + error.message);
            }
        });
    },

// 메시지 중요 표시 토글
    async toggleMessageImportant(messageId, userId) {
        try {
            const [message] = await dbUtils.query(
                'SELECT isImportant FROM messages WHERE id = ? AND senderId = ?',
                [messageId, userId]
            );

            if (!message) {
                throw new Error('메시지를 찾을 수 없거나 권한이 없습니다.');
            }

            await dbUtils.query(
                'UPDATE messages SET isImportant = NOT isImportant WHERE id = ?',
                [messageId]
            );

            return { success: true };
        } catch (error) {
            throw new Error('메시지 중요 표시 토글 실패: ' + error.message);
        }
    },

// 채팅방 이름 변경
    async updateRoomName(roomId, roomName, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [participant] = await connection.query(
                    'SELECT role FROM chat_room_participants WHERE roomId = ? AND memberId = ?',
                    [roomId, userId]
                );

                if (!participant || participant.role !== 'admin') {
                    throw new Error('채팅방 이름 변경 권한이 없습니다.');
                }

                await connection.query(
                    'UPDATE chat_rooms SET name = ? WHERE id = ?',
                    [roomName, roomId]
                );

                return { success: true, name: roomName };
            } catch (error) {
                throw new Error('채팅방 이름 변경 실패: ' + error.message);
            }
        });
    },

// 채팅방 참여자 관리
    async updateRoomParticipants(roomId, participants, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(
                    'SELECT id FROM chat_room_participants WHERE roomId = ? AND memberId = ? AND role = "admin"',
                    [roomId, userId]
                );

                if (!admin) {
                    throw new Error('참여자 관리 권한이 없습니다.');
                }

                await connection.query(
                    'DELETE FROM chat_room_participants WHERE roomId = ? AND memberId NOT IN (?)',
                    [roomId, participants]
                );

                for (const memberId of participants) {
                    await connection.query(`
                    INSERT INTO chat_room_participants (roomId, memberId, role)
                    VALUES (?, ?, 'member')
                    ON DUPLICATE KEY UPDATE role = 'member'
                `, [roomId, memberId]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('참여자 관리 실패: ' + error.message);
            }
        });
    },

// 채팅방 고정/고정해제
    async toggleRoomPin(roomId, isPinned, userId) {
        try {
            const [participant] = await dbUtils.query(
                'SELECT id FROM chat_room_participants WHERE roomId = ? AND memberId = ?',
                [roomId, userId]
            );

            if (!participant) {
                throw new Error('채팅방을 찾을 수 없습니다.');
            }

            await dbUtils.query(
                'UPDATE chat_rooms SET isPinned = ? WHERE id = ?',
                [isPinned, roomId]
            );

            return { success: true, isPinned };
        } catch (error) {
            throw new Error('채팅방 고정 상태 변경 실패: ' + error.message);
        }
    },

// 채팅방 삭제
    async deleteChatRoom(roomId, userId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                const [admin] = await connection.query(
                    'SELECT id FROM chat_room_participants WHERE roomId = ? AND memberId = ? AND role = "admin"',
                    [roomId, userId]
                );

                if (!admin) {
                    throw new Error('채팅방 삭제 권한이 없습니다.');
                }

                await connection.query(
                    'UPDATE chat_rooms SET deletedAt = NOW() WHERE id = ?',
                    [roomId]
                );

                await connection.query(
                    'UPDATE chat_room_participants SET deletedAt = NOW() WHERE roomId = ?',
                    [roomId]
                );

                return { success: true };
            } catch (error) {
                throw new Error('채팅방 삭제 실패: ' + error.message);
            }
        });
    }
};

module.exports = chatService;
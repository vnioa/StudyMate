const { dbUtils } = require('../config/db');
const admin = require('firebase-admin');

const chatService = {
    // 읽지 않은 메시지 수 조회
    async getUnreadCount() {
        try {
            const query = `
                SELECT COUNT(*) as unreadCount
                FROM messages m
                         JOIN chat_room_participants p ON m.roomId = p.roomId
                WHERE p.userId = ? AND m.isRead = false AND m.senderId != ?
            `;
            const result = await dbUtils.query(query, [req.user.id, req.user.id]);
            return { unreadCount: result[0].unreadCount };
        } catch (error) {
            throw new Error('읽지 않은 메시지 수 조회 실패: ' + error.message);
        }
    },

    // 채팅방 생성
    async createChatRoom(data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 채팅방 생성
                const [result] = await connection.query(`
                    INSERT INTO chat_rooms (type, name)
                    VALUES (?, ?)
                `, [data.type, data.type === 'group' ? data.name : null]);

                const roomId = result.insertId;

                // 참여자 추가
                const participants = [req.user.id, ...data.participants];
                await connection.query(`
                    INSERT INTO chat_room_participants (roomId, userId, role)
                    VALUES ${participants.map(userId =>
                            `(?, ?, ${userId === req.user.id ? "'admin'" : "'member'"})`
                    ).join(',')}
                `, participants.flatMap(userId => [roomId, userId]));

                return { roomId };
            } catch (error) {
                throw new Error('채팅방 생성 실패: ' + error.message);
            }
        });
    },

    // 채팅방 목록 조회
    async getChatRooms(params) {
        try {
            const { page = 1, limit = 20 } = params;
            const offset = (page - 1) * limit;

            const query = `
                SELECT r.*,
                       m.content as lastMessageContent,
                       m.createdAt as lastMessageTime,
                       COUNT(CASE WHEN m2.isRead = false AND m2.senderId != ? THEN 1 END) as unreadCount
                FROM chat_rooms r
                         JOIN chat_room_participants p ON r.id = p.roomId
                         LEFT JOIN messages m ON r.lastMessageAt = m.createdAt AND r.id = m.roomId
                         LEFT JOIN messages m2 ON r.id = m2.roomId
                WHERE p.userId = ?
                GROUP BY r.id
                ORDER BY r.isPinned DESC, r.lastMessageAt DESC
                    LIMIT ? OFFSET ?
            `;

            const rooms = await dbUtils.query(query, [
                req.user.id, req.user.id, limit, offset
            ]);

            const [{ total }] = await dbUtils.query(
                'SELECT COUNT(*) as total FROM chat_room_participants WHERE userId = ?',
                [req.user.id]
            );

            return { rooms, totalCount: total };
        } catch (error) {
            throw new Error('채팅방 목록 조회 실패: ' + error.message);
        }
    },

    // 채팅방 검색
    async searchRooms(query) {
        try {
            const searchQuery = `
                SELECT r.*
                FROM chat_rooms r
                         JOIN chat_room_participants p ON r.id = p.roomId
                WHERE p.userId = ? AND r.name LIKE ?
            `;
            const rooms = await dbUtils.query(searchQuery, [
                req.user.id, `%${query}%`
            ]);
            return { rooms };
        } catch (error) {
            throw new Error('채팅방 검색 실패: ' + error.message);
        }
    },

    // 메시지 전송
    async sendMessage(roomId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 메시지 저장
                const [result] = await connection.query(`
                    INSERT INTO messages (roomId, senderId, content, type)
                    VALUES (?, ?, ?, ?)
                `, [roomId, req.user.id, data.content, data.type]);

                // 채팅방 최근 메시지 시간 업데이트
                await connection.query(`
                    UPDATE chat_rooms
                    SET lastMessageAt = NOW()
                    WHERE id = ?
                `, [roomId]);

                // FCM 알림 발송
                const [participants] = await connection.query(`
                    SELECT u.fcmToken
                    FROM chat_room_participants p
                             JOIN users u ON p.userId = u.id
                    WHERE p.roomId = ? AND p.userId != ?
                `, [roomId, req.user.id]);

                if (participants.length > 0) {
                    await admin.messaging().sendMulticast({
                        tokens: participants.map(p => p.fcmToken),
                        notification: {
                            title: '새 메시지',
                            body: data.content
                        }
                    });
                }

                return {
                    messageId: result.insertId,
                    sentAt: new Date()
                };
            } catch (error) {
                throw new Error('메시지 전송 실패: ' + error.message);
            }
        });
    },

    // getChatRoom(roomId) 구현
    async getChatRoom(roomId) {
        try {
            const query = `
                SELECT r.*,
                       m.id as lastMessageId,
                       m.content as lastMessageContent,
                       m.createdAt as lastMessageTime,
                       m.senderId as lastMessageSenderId
                FROM chat_rooms r
                         LEFT JOIN messages m ON r.lastMessageAt = m.createdAt AND r.id = m.roomId
                WHERE r.id = ?
            `;

            const room = await dbUtils.query(query, [roomId]);

            if (!room.length) {
                throw new Error('채팅방을 찾을 수 없습니다');
            }

            // 참여자 목록 조회
            const participantsQuery = `
                SELECT u.id, u.name, u.profileImage, p.role
                FROM chat_room_participants p
                         JOIN users u ON p.userId = u.id
                WHERE p.roomId = ?
            `;
            const participants = await dbUtils.query(participantsQuery, [roomId]);

            // 최근 메시지 목록 조회
            const messagesQuery = `
                SELECT m.*, u.name as senderName, u.profileImage as senderProfileImage
                FROM messages m
                         JOIN users u ON m.senderId = u.id
                WHERE m.roomId = ?
                ORDER BY m.createdAt DESC
                    LIMIT 50
            `;
            const messages = await dbUtils.query(messagesQuery, [roomId]);

            return {
                room: {
                    ...room[0],
                    participants,
                    messages: messages.reverse()
                }
            };
        } catch (error) {
            throw new Error('채팅방 조회 실패: ' + error.message);
        }
    },

// getRoomDetail(roomId) 구현
    async getRoomDetail(roomId) {
        try {
            const query = `
                SELECT r.*,
                       COUNT(DISTINCT m.id) as messageCount,
                       COUNT(DISTINCT p.userId) as participantCount
                FROM chat_rooms r
                         LEFT JOIN messages m ON r.id = m.roomId
                         LEFT JOIN chat_room_participants p ON r.id = p.roomId
                WHERE r.id = ?
                GROUP BY r.id
            `;

            const roomInfo = await dbUtils.query(query, [roomId]);

            if (!roomInfo.length) {
                throw new Error('채팅방을 찾을 수 없습니다');
            }

            return { roomInfo: roomInfo[0] };
        } catch (error) {
            throw new Error('채팅방 상세 정보 조회 실패: ' + error.message);
        }
    },

// updateRoomSettings(roomId, data) 구현
    async updateRoomSettings(roomId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                await connection.query(`
                    UPDATE chat_rooms
                    SET notification = ?,
                        encryption = ?,
                        theme = ?,
                        roomName = ?
                    WHERE id = ?
                `, [
                    data.notification,
                    data.encryption,
                    data.theme,
                    data.roomName,
                    roomId
                ]);

                return { success: true };
            } catch (error) {
                throw new Error('채팅방 설정 업데이트 실패: ' + error.message);
            }
        });
    },

// updateRoomName(roomId, data) 구현
    async updateRoomName(roomId, data) {
        try {
            const query = `
                UPDATE chat_rooms
                SET name = ?
                WHERE id = ? AND type = 'group'
            `;

            const result = await dbUtils.query(query, [data.roomName, roomId]);

            if (result.affectedRows === 0) {
                throw new Error('채팅방 이름 변경 권한이 없습니다');
            }

            return { success: true };
        } catch (error) {
            throw new Error('채팅방 이름 변경 실패: ' + error.message);
        }
    },

// updateParticipants(roomId, data) 구현
    async updateParticipants(roomId, data) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 기존 참여자 확인
                const currentParticipants = await connection.query(
                    'SELECT userId FROM chat_room_participants WHERE roomId = ?',
                    [roomId]
                );

                // 새로운 참여자 추가
                const newParticipants = data.participants.filter(
                    userId => !currentParticipants.find(p => p.userId === userId)
                );

                if (newParticipants.length > 0) {
                    await connection.query(`
                                INSERT INTO chat_room_participants (roomId, userId, role)
                                VALUES ${newParticipants.map(() => '(?, ?, "member")').join(',')}
                        `, [...newParticipants.flatMap(userId => [roomId, userId])]
                    );
                }

                // 제거된 참여자 삭제
                const removedParticipants = currentParticipants
                    .filter(p => !data.participants.includes(p.userId))
                    .map(p => p.userId);

                if (removedParticipants.length > 0) {
                    await connection.query(`
                        DELETE FROM chat_room_participants
                        WHERE roomId = ? AND userId IN (?)
                    `, [roomId, removedParticipants]);
                }

                return { success: true };
            } catch (error) {
                throw new Error('참여자 목록 업데이트 실패: ' + error.message);
            }
        });
    },

    // pinChatRoom(roomId, isPinned) 구현
    async pinChatRoom(roomId, isPinned) {
        try {
            // 채팅방 고정 상태 업데이트
            const query = `
                UPDATE chat_rooms
                SET isPinned = ?
                WHERE id = ?
            `;

            const result = await dbUtils.query(query, [isPinned, roomId]);

            if (result.affectedRows === 0) {
                throw new Error('채팅방을 찾을 수 없습니다');
            }

            return {
                success: true,
                isPinned
            };
        } catch (error) {
            throw new Error('채팅방 고정 상태 변경 실패: ' + error.message);
        }
    },

    // deleteRoom(roomId) 구현
    async deleteRoom(roomId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 채팅방 이미지 메시지 삭제
                const imageMessages = await connection.query(
                    'SELECT content FROM messages WHERE roomId = ? AND type = "image"',
                    [roomId]
                );

                // 이미지 파일 삭제 처리
                for (const message of imageMessages) {
                    const imageUrl = message.content;
                    // 실제 파일 삭제 로직 구현 필요
                    // await deleteFile(imageUrl);
                }

                // 채팅방 관련 데이터 삭제
                await connection.query('DELETE FROM messages WHERE roomId = ?', [roomId]);
                await connection.query('DELETE FROM chat_room_participants WHERE roomId = ?', [roomId]);
                await connection.query('DELETE FROM chat_rooms WHERE id = ?', [roomId]);

                return { success: true };
            } catch (error) {
                throw new Error('채팅방 삭제 실패: ' + error.message);
            }
        });
    },

    // sendImageMessage(roomId, file) 구현
    async sendImageMessage(roomId, file) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 이미지 업로드 처리
                const fileName = `${Date.now()}_${file.originalname}`;
                const imageUrl = await uploadImage(file, fileName); // 실제 이미지 업로드 함수 구현 필요

                // 메시지 저장
                const [result] = await connection.query(`
                    INSERT INTO messages (roomId, senderId, content, type)
                    VALUES (?, ?, ?, 'image')
                `, [roomId, req.user.id, imageUrl]);

                // 채팅방 최근 메시지 시간 업데이트
                await connection.query(`
                    UPDATE chat_rooms
                    SET lastMessageAt = NOW()
                    WHERE id = ?
                `, [roomId]);

                return {
                    message: {
                        id: result.insertId,
                        content: imageUrl,
                        type: 'image',
                        senderId: req.user.id,
                        createdAt: new Date()
                    }
                };
            } catch (error) {
                throw new Error('이미지 메시지 전송 실패: ' + error.message);
            }
        });
    },

    // markAsRead(roomId, messageId) 구현
    async markAsRead(roomId, messageId) {
        try {
            await dbUtils.query(`
                UPDATE messages
                SET isRead = true,
                    readAt = NOW()
                WHERE id = ? AND roomId = ?
            `, [messageId, roomId]);

            await dbUtils.query(`
                UPDATE chat_room_participants
                SET lastReadMessageId = ?
                WHERE roomId = ? AND userId = ?
            `, [messageId, roomId, req.user.id]);

            return { success: true };
        } catch (error) {
            throw new Error('메시지 읽음 처리 실패: ' + error.message);
        }
    },

    // toggleImportant(messageId) 구현
    async toggleImportant(messageId) {
        try {
            const [message] = await dbUtils.query(
                'SELECT isImportant FROM messages WHERE id = ?',
                [messageId]
            );

            if (!message) {
                throw new Error('메시지를 찾을 수 없습니다');
            }

            const newStatus = !message.isImportant;
            await dbUtils.query(
                'UPDATE messages SET isImportant = ? WHERE id = ?',
                [newStatus, messageId]
            );

            return {
                success: true,
                isImportant: newStatus
            };
        } catch (error) {
            throw new Error('메시지 중요 표시 토글 실패: ' + error.message);
        }
    },

    // leaveRoom(roomId) 구현
    async leaveRoom(roomId) {
        return await dbUtils.transaction(async (connection) => {
            try {
                // 참여자 정보 확인
                const [participant] = await connection.query(`
                    SELECT role FROM chat_room_participants
                    WHERE roomId = ? AND userId = ?
                `, [roomId, req.user.id]);

                if (!participant) {
                    throw new Error('채팅방 참여자가 아닙니다');
                }

                // 관리자인 경우 다른 관리자 지정
                if (participant.role === 'admin') {
                    const [newAdmin] = await connection.query(`
                        SELECT userId FROM chat_room_participants
                        WHERE roomId = ? AND userId != ?
                    LIMIT 1
                    `, [roomId, req.user.id]);

                    if (newAdmin) {
                        await connection.query(`
                            UPDATE chat_room_participants
                            SET role = 'admin'
                            WHERE roomId = ? AND userId = ?
                        `, [roomId, newAdmin.userId]);
                    }
                }

                // 참여자 제거
                await connection.query(`
                    DELETE FROM chat_room_participants
                    WHERE roomId = ? AND userId = ?
                `, [roomId, req.user.id]);

                return { success: true };
            } catch (error) {
                throw new Error('채팅방 나가기 실패: ' + error.message);
            }
        });
    }
};

module.exports = chatService;
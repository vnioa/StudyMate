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

const chatController = {
    // 읽지 않은 메시지 수 조회
    getUnreadCount: async (req, res) => {
        try {
            const userId = req.user.id;
            const query = `
        SELECT COUNT(*) as unreadCount 
        FROM messages m 
        JOIN chat_room_participants crp ON m.roomId = crp.roomId 
        WHERE crp.memberId = ? 
        AND (m.id > crp.lastReadMessageId OR crp.lastReadMessageId IS NULL)
        AND m.senderId != ?
      `;

            const [result] = await utils.executeQuery(query, [userId, userId]);

            res.status(200).json({
                success: true,
                data: { unreadCount: result.unreadCount }
            });
        } catch (error) {
            console.error('읽지 않은 메시지 수 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '읽지 않은 메시지 수 조회에 실패했습니다.'
            });
        }
    },

    // 채팅방 생성
    createChatRoom: async (req, res) => {
        try {
            const { type, participants, name } = req.body;
            const userId = req.user.id;

            const result = await utils.executeTransaction(async (connection) => {
                const [room] = await connection.execute(
                    'INSERT INTO chat_rooms (type, name) VALUES (?, ?)',
                    [type, name]
                );

                const participantValues = [...participants, userId].map(memberId => [
                    room.insertId,
                    memberId,
                    memberId === userId ? 'admin' : 'member'
                ]);

                await connection.execute(
                    'INSERT INTO chat_room_participants (roomId, memberId, role) VALUES ?',
                    [participantValues]
                );

                return { id: room.insertId, type, name };
            });

            res.status(201).json({
                success: true,
                message: '채팅방이 생성되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('채팅방 생성 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 생성에 실패했습니다.'
            });
        }
    },

    // 채팅방 목록 조회
    getChatRooms: async (req, res) => {
        try {
            const userId = req.user.id;
            const query = `
        SELECT cr.*, m.content as lastMessageContent, 
               m.createdAt as lastMessageTime,
               COUNT(CASE WHEN m2.isRead = false 
                         AND m2.senderId != ? THEN 1 END) as unreadCount
        FROM chat_rooms cr
        JOIN chat_room_participants crp ON cr.id = crp.roomId
        LEFT JOIN messages m ON cr.lastMessageAt = m.createdAt AND cr.id = m.roomId
        LEFT JOIN messages m2 ON cr.id = m2.roomId 
                            AND m2.id > COALESCE(crp.lastReadMessageId, 0)
        WHERE crp.memberId = ?
        GROUP BY cr.id
        ORDER BY cr.isPinned DESC, cr.lastMessageAt DESC
      `;

            const rooms = await utils.executeQuery(query, [userId, userId]);

            res.status(200).json({
                success: true,
                data: rooms
            });
        } catch (error) {
            console.error('채팅방 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 목록 조회에 실패했습니다.'
            });
        }
    },

    // 채팅방 검색
    searchRooms: async (req, res) => {
        try {
            const { query } = req.query;
            const userId = req.user.id;

            const rooms = await utils.executeQuery(`
        SELECT cr.* 
        FROM chat_rooms cr 
        JOIN chat_room_participants crp ON cr.id = crp.roomId 
        WHERE crp.memberId = ? AND cr.name LIKE ?
        ORDER BY cr.lastMessageAt DESC
      `, [userId, `%${query}%`]);

            res.status(200).json({
                success: true,
                data: rooms
            });
        } catch (error) {
            console.error('채팅방 검색 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 검색에 실패했습니다.'
            });
        }
    },

    // 채팅방 상세 조회
    getChatRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            const [room] = await utils.executeQuery(`
        SELECT cr.*, m.content as lastMessageContent, 
               COUNT(DISTINCT msg.id) as messageCount,
               crp.role as userRole
        FROM chat_rooms cr
        JOIN chat_room_participants crp ON cr.id = crp.roomId
        LEFT JOIN messages m ON cr.lastMessageAt = m.createdAt AND cr.id = m.roomId
        LEFT JOIN messages msg ON cr.id = msg.roomId
        WHERE cr.id = ? AND crp.memberId = ?
        GROUP BY cr.id
      `, [roomId, userId]);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: '채팅방을 찾을 수 없거나 접근 권한이 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: room
            });
        } catch (error) {
            console.error('채팅방 상세 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 상세 조회에 실패했습니다.'
            });
        }
    },

    // 채팅방 설정 조회
    getRoomDetail: async (req, res) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            const [settings] = await utils.executeQuery(`
        SELECT cr.notification, cr.encryption, cr.theme, cr.name,
               crp.role as userRole
        FROM chat_rooms cr
        JOIN chat_room_participants crp ON cr.id = crp.roomId
        WHERE cr.id = ? AND crp.memberId = ?
      `, [roomId, userId]);

            if (!settings) {
                return res.status(404).json({
                    success: false,
                    message: '채팅방 설정을 찾을 수 없습니다.'
                });
            }

            res.status(200).json({
                success: true,
                data: settings
            });
        } catch (error) {
            console.error('채팅방 설정 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 설정 조회에 실패했습니다.'
            });
        }
    },

    // 채팅방 참여자 관리
    updateParticipants: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { participants } = req.body;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const [admin] = await connection.execute(
                    'SELECT id FROM chat_room_participants WHERE roomId = ? AND memberId = ? AND role = "admin"',
                    [roomId, userId]
                );

                if (!admin) {
                    throw new Error('참여자 관리 권한이 없습니다.');
                }

                await connection.execute(
                    'DELETE FROM chat_room_participants WHERE roomId = ? AND memberId NOT IN (?)',
                    [roomId, participants]
                );

                for (const memberId of participants) {
                    await connection.execute(`
            INSERT INTO chat_room_participants (roomId, memberId, role)
            VALUES (?, ?, 'member')
            ON DUPLICATE KEY UPDATE role = 'member'
          `, [roomId, memberId]);
                }
            });

            res.status(200).json({
                success: true,
                message: '채팅방 참여자가 업데이트되었습니다.'
            });
        } catch (error) {
            console.error('참여자 관리 오류:', error);
            res.status(500).json({
                success: false,
                message: '참여자 관리에 실패했습니다.'
            });
        }
    },

    // 채팅방 고정/고정해제
    pinChatRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const { isPinned } = req.body;
            const userId = req.user.id;

            const [participant] = await utils.executeQuery(
                'SELECT id FROM chat_room_participants WHERE roomId = ? AND memberId = ?',
                [roomId, userId]
            );

            if (!participant) {
                return res.status(404).json({
                    success: false,
                    message: '채팅방을 찾을 수 없습니다.'
                });
            }

            await utils.executeQuery(
                'UPDATE chat_rooms SET isPinned = ? WHERE id = ?',
                [isPinned, roomId]
            );

            res.status(200).json({
                success: true,
                message: isPinned ? '채팅방이 고정되었습니다.' : '채팅방 고정이 해제되었습니다.'
            });
        } catch (error) {
            console.error('채팅방 고정 상태 변경 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 고정 상태 변경에 실패했습니다.'
            });
        }
    },

    // 채팅방 삭제
    deleteRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const userId = req.user.id;

            await utils.executeTransaction(async (connection) => {
                const [admin] = await connection.execute(
                    'SELECT id FROM chat_room_participants WHERE roomId = ? AND memberId = ? AND role = "admin"',
                    [roomId, userId]
                );

                if (!admin) {
                    throw new Error('채팅방 삭제 권한이 없습니다.');
                }

                await connection.execute(
                    'UPDATE chat_rooms SET deletedAt = NOW() WHERE id = ?',
                    [roomId]
                );

                await connection.execute(
                    'UPDATE chat_room_participants SET deletedAt = NOW() WHERE roomId = ?',
                    [roomId]
                );
            });

            res.status(200).json({
                success: true,
                message: '채팅방이 삭제되었습니다.'
            });
        } catch (error) {
            console.error('채팅방 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 삭제에 실패했습니다.'
            });
        }
    },

    // 채팅방 설정 업데이트
    updateRoomSettings: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId } = req.params;
            const { notification, encryption, theme, roomName } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [room] = await connection.execute(
                    'SELECT * FROM chat_rooms WHERE id = ?',
                    [roomId]
                );

                if (!room) {
                    throw new Error('채팅방을 찾을 수 없습니다.');
                }

                await connection.execute(`
                UPDATE chat_room_settings
                SET notification = ?,
                    encryption = ?,
                    theme = ?,
                    updatedAt = NOW()
                WHERE roomId = ?
            `, [notification, encryption, theme, roomId]);

                return { success: true };
            });

            res.status(200).json({
                success: true,
                message: '채팅방 설정이 업데이트되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('채팅방 설정 업데이트 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 설정 업데이트에 실패했습니다.'
            });
        }
    },

// 채팅방 이름 업데이트
    updateRoomName: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId } = req.params;
            const { roomName } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                await connection.execute(`
                UPDATE chat_rooms
                SET name = ?, updatedAt = NOW()
                WHERE id = ?
            `, [roomName, roomId]);

                await connection.execute(`
                INSERT INTO chat_messages (
                    roomId, type, content, senderId, createdAt
                ) VALUES (?, 'system', ?, ?, NOW())
            `, [roomId, `${req.user.name}님이 채팅방 이름을 변경했습니다.`, userId]);

                return { roomName };
            });

            res.status(200).json({
                success: true,
                message: '채팅방 이름이 변경되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('채팅방 이름 변경 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 이름 변경에 실패했습니다.'
            });
        }
    },

// 메시지 전송
    sendMessage: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId } = req.params;
            const { content, type } = req.body;

            const result = await utils.executeTransaction(async (connection) => {
                const [message] = await connection.execute(`
                INSERT INTO chat_messages (
                    roomId, senderId, type, content, createdAt
                ) VALUES (?, ?, ?, ?, NOW())
            `, [roomId, userId, type, content]);

                return {
                    id: message.insertId,
                    content,
                    type,
                    createdAt: new Date()
                };
            });

            res.status(201).json({
                success: true,
                message: '메시지가 전송되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            res.status(500).json({
                success: false,
                message: '메시지 전송에 실패했습니다.'
            });
        }
    },

    // 이미지 메시지 전송
    sendImageMessage: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '이미지 파일이 필요합니다.'
                });
            }

            const result = await utils.executeTransaction(async (connection) => {
                // 채팅방 존재 여부 및 권한 확인
                const [room] = await connection.execute(
                    'SELECT * FROM chat_rooms WHERE id = ?',
                    [roomId]
                );

                if (!room) {
                    throw new Error('채팅방을 찾을 수 없습니다.');
                }

                // 채팅방 멤버 확인
                const [member] = await connection.execute(
                    'SELECT * FROM chat_room_members WHERE roomId = ? AND memberId = ? AND leftAt IS NULL',
                    [roomId, userId]
                );

                if (!member) {
                    throw new Error('채팅방에 참여하지 않은 사용자입니다.');
                }

                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 10000);
                const ext = path.extname(file.originalname);
                const filename = `${timestamp}_${random}${ext}`;
                const imageUrl = `uploads/chat/${roomId}/${filename}`;

                // 메시지 저장
                const [message] = await connection.execute(`
                INSERT INTO chat_messages (
                    roomId, senderId, type, content, createdAt
                ) VALUES (?, ?, 'image', ?, NOW())
            `, [roomId, userId, imageUrl]);

                // 채팅방 마지막 메시지 업데이트
                await connection.execute(`
                UPDATE chat_rooms 
                SET lastMessageAt = NOW(),
                    lastMessageType = 'image',
                    lastMessageContent = '이미지'
                WHERE id = ?
            `, [roomId]);

                return {
                    id: message.insertId,
                    imageUrl,
                    type: 'image',
                    senderId: userId,
                    createdAt: new Date()
                };
            });

            res.status(201).json({
                success: true,
                message: '이미지가 전송되었습니다.',
                data: result
            });
        } catch (error) {
            console.error('이미지 전송 오류:', error);
            res.status(500).json({
                success: false,
                message: error.message || '이미지 전송에 실패했습니다.'
            });
        }
    },

// 메시지 읽음 처리
    markAsRead: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId, messageId } = req.params;

            await utils.executeQuery(`
            INSERT INTO message_reads (
                messageId, memberId, readAt
            ) VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE readAt = NOW()
        `, [messageId, userId]);

            res.status(200).json({
                success: true,
                message: '메시지를 읽음 처리했습니다.'
            });
        } catch (error) {
            console.error('메시지 읽음 처리 오류:', error);
            res.status(500).json({
                success: false,
                message: '메시지 읽음 처리에 실패했습니다.'
            });
        }
    },

// 중요 메시지 토글
    toggleImportant: async (req, res) => {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;

            const result = await utils.executeTransaction(async (connection) => {
                const [current] = await connection.execute(
                    'SELECT isImportant FROM chat_messages WHERE id = ?',
                    [messageId]
                );

                const newStatus = !current.isImportant;

                await connection.execute(`
                UPDATE chat_messages
                SET isImportant = ?, updatedAt = NOW()
                WHERE id = ?
            `, [newStatus, messageId]);

                return { isImportant: newStatus };
            });

            res.status(200).json({
                success: true,
                message: `메시지를 ${result.isImportant ? '중요' : '일반'} 표시했습니다.`,
                data: result
            });
        } catch (error) {
            console.error('중요 메시지 토글 오류:', error);
            res.status(500).json({
                success: false,
                message: '중요 메시지 토글에 실패했습니다.'
            });
        }
    },

// 채팅방 참여
    joinRoom: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId } = req.params;

            await utils.executeTransaction(async (connection) => {
                await connection.execute(`
                INSERT INTO chat_room_members (
                    roomId, memberId, joinedAt
                ) VALUES (?, ?, NOW())
            `, [roomId, userId]);

                await connection.execute(`
                INSERT INTO chat_messages (
                    roomId, type, content, senderId, createdAt
                ) VALUES (?, 'system', ?, ?, NOW())
            `, [roomId, `${req.user.name}님이 입장했습니다.`, userId]);
            });

            res.status(200).json({
                success: true,
                message: '채팅방에 참여했습니다.'
            });
        } catch (error) {
            console.error('채팅방 참여 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 참여에 실패했습니다.'
            });
        }
    },

// 채팅방 나가기
    leaveRoom: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId } = req.params;

            await utils.executeTransaction(async (connection) => {
                await connection.execute(`
                UPDATE chat_room_members
                SET leftAt = NOW()
                WHERE roomId = ? AND memberId = ?
            `, [roomId, userId]);

                await connection.execute(`
                INSERT INTO chat_messages (
                    roomId, type, content, senderId, createdAt
                ) VALUES (?, 'system', ?, ?, NOW())
            `, [roomId, `${req.user.name}님이 퇴장했습니다.`, userId]);
            });

            res.status(200).json({
                success: true,
                message: '채팅방을 나갔습니다.'
            });
        } catch (error) {
            console.error('채팅방 나가기 오류:', error);
            res.status(500).json({
                success: false,
                message: '채팅방 나가기에 실패했습니다.'
            });
        }
    },

// 피드 액션 처리
    handleFeedAction: async (req, res) => {
        try {
            const userId = req.user.id;
            const { roomId, feedId, actionType } = req.params;

            const validActions = ['like', 'bookmark', 'share'];
            if (!validActions.includes(actionType)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 액션입니다.'
                });
            }

            await utils.executeTransaction(async (connection) => {
                const actionTable = {
                    like: 'chat_feed_likes',
                    bookmark: 'chat_feed_bookmarks',
                    share: 'chat_feed_shares'
                };

                await connection.execute(`
                INSERT INTO ${actionTable[actionType]} (
                    feedId, memberId, createdAt
                ) VALUES (?, ?, NOW())
                ON DUPLICATE KEY UPDATE updatedAt = NOW()
            `, [feedId, userId]);
            });

            res.status(200).json({
                success: true,
                message: '액션이 처리되었습니다.'
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

module.exports = chatController;
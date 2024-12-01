const db = require('../models');
const { Op } = require('sequelize');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);

const chatService = {
    // 읽지 않은 메시지 수 조회
    getUnreadCount: async (userId) => {
        try {
            const unreadCount = await db.Message.count({
                where: {
                    isRead: false,
                    recipientId: userId
                }
            });
            return { unreadCount };
        } catch (error) {
            throw new Error('읽지 않은 메시지 수 조회 실패');
        }
    },

    // 채팅방 생성
    createChatRoom: async (data) => {
        const transaction = await db.sequelize.transaction();
        try {
            const room = await db.ChatRoom.create({
                type: data.type,
                createdAt: new Date()
            }, { transaction });

            if (data.participants) {
                await db.ChatRoomParticipant.bulkCreate(
                    data.participants.map(userId => ({
                        roomId: room.id,
                        userId
                    })),
                    { transaction }
                );
            }

            await transaction.commit();
            return { roomId: room.id };
        } catch (error) {
            await transaction.rollback();
            throw new Error('채팅방 생성 실패');
        }
    },

    // 채팅방 목록 조회
    getChatRooms: async ({ page = 1, limit = 20 }) => {
        try {
            const offset = (page - 1) * limit;
            const { rows: rooms, count: totalCount } = await db.ChatRoom.findAndCountAll({
                include: [
                    {
                        model: db.Message,
                        as: 'lastMessage',
                        limit: 1,
                        order: [['createdAt', 'DESC']]
                    },
                    {
                        model: db.User,
                        as: 'participants',
                        attributes: ['id', 'name', 'profileImage']
                    }
                ],
                limit,
                offset,
                order: [['updatedAt', 'DESC']]
            });
            return { rooms, totalCount };
        } catch (error) {
            throw new Error('채팅방 목록 조회 실패');
        }
    },

    // 채팅방 상세 조회
    getChatRoom: async (roomId) => {
        try {
            const room = await db.ChatRoom.findOne({
                where: { id: roomId },
                include: [
                    {
                        model: db.Message,
                        order: [['createdAt', 'DESC']],
                        limit: 50
                    },
                    {
                        model: db.User,
                        as: 'participants'
                    }
                ]
            });

            if (!room) {
                throw new Error('채팅방을 찾을 수 없습니다');
            }

            return { room, messages: room.Messages };
        } catch (error) {
            throw new Error('채팅방 상세 조회 실패');
        }
    },

    // 채팅방 검색
    searchRooms: async (query) => {
        try {
            const rooms = await db.ChatRoom.findAll({
                where: {
                    [Op.or]: [
                        { name: { [Op.like]: `%${query}%` } },
                        { '$participants.name$': { [Op.like]: `%${query}%` } }
                    ]
                },
                include: [{
                    model: db.User,
                    as: 'participants'
                }]
            });
            return { rooms };
        } catch (error) {
            throw new Error('채팅방 검색 실패');
        }
    },

    // 메시지 전송
    sendMessage: async (roomId, data) => {
        const transaction = await db.sequelize.transaction();
        try {
            const message = await db.Message.create({
                roomId,
                content: data.content,
                type: data.type,
                sentAt: new Date()
            }, { transaction });

            // 채팅방 최종 업데이트 시간 갱신
            await db.ChatRoom.update(
                { updatedAt: new Date() },
                { where: { id: roomId }, transaction }
            );

            // FCM 알림 전송
            const participants = await db.ChatRoomParticipant.findAll({
                where: { roomId }
            });

            const fcmTokens = await db.User.findAll({
                where: {
                    id: {
                        [Op.in]: participants.map(p => p.userId)
                    }
                },
                attributes: ['fcmToken']
            });

            const notification = {
                notification: {
                    title: '새 메시지',
                    body: data.content
                },
                data: {
                    roomId: roomId.toString(),
                    messageType: data.type
                }
            };

            await admin.messaging().sendToDevice(
                fcmTokens.map(token => token.fcmToken),
                notification
            );

            await transaction.commit();
            return { messageId: message.id, sentAt: message.sentAt };
        } catch (error) {
            await transaction.rollback();
            throw new Error('메시지 전송 실패');
        }
    },

    // 이미지 메시지 전송
    sendImageMessage: async (roomId, file) => {
        const transaction = await db.sequelize.transaction();
        try {
            const fileName = `chat-images/${roomId}/${Date.now()}-${file.originalname}`;
            const blob = bucket.file(fileName);
            const blobStream = blob.createWriteStream({
                metadata: {
                    contentType: file.mimetype
                }
            });

            await new Promise((resolve, reject) => {
                blobStream.on('error', reject);
                blobStream.on('finish', resolve);
                blobStream.end(file.buffer);
            });

            const imageUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET}/${fileName}`;

            const message = await db.Message.create({
                roomId,
                content: imageUrl,
                type: 'image',
                sentAt: new Date()
            }, { transaction });

            await transaction.commit();
            return { message };
        } catch (error) {
            await transaction.rollback();
            throw new Error('이미지 메시지 전송 실패');
        }
    },

    // 메시지 읽음 처리
    markAsRead: async (roomId, messageId) => {
        try {
            await db.Message.update(
                { isRead: true, readAt: new Date() },
                {
                    where: {
                        id: messageId,
                        roomId,
                        isRead: false
                    }
                }
            );
            return { success: true };
        } catch (error) {
            throw new Error('메시지 읽음 처리 실패');
        }
    },

    // 채팅방 나가기
    leaveRoom: async (roomId, userId) => {
        const transaction = await db.sequelize.transaction();
        try {
            await db.ChatRoomParticipant.destroy({
                where: {
                    roomId,
                    userId
                },
                transaction
            });

            // 마지막 참여자가 나가면 채팅방 삭제
            const remainingParticipants = await db.ChatRoomParticipant.count({
                where: { roomId }
            });

            if (remainingParticipants === 0) {
                await chatService.deleteRoom(roomId);
            }

            await transaction.commit();
            return { success: true };
        } catch (error) {
            await transaction.rollback();
            throw new Error('채팅방 나가기 실패');
        }
    },

    // 채팅방 고정/고정해제
    pinChatRoom: async (roomId, isPinned) => {
        try {
            await db.ChatRoom.update(
                { isPinned },
                { where: { id: roomId } }
            );
            return { success: true, isPinned };
        } catch (error) {
            throw new Error('채팅방 고정/고정해제 실패');
        }
    },

    // 채팅방 삭제
    deleteRoom: async (roomId) => {
        const transaction = await db.sequelize.transaction();
        try {
            // 채팅방의 모든 이미지 파일 삭제
            const messages = await db.Message.findAll({
                where: {
                    roomId,
                    type: 'image'
                }
            });

            for (const message of messages) {
                const fileName = message.content.split('/').pop();
                await bucket.file(`chat-images/${roomId}/${fileName}`).delete();
            }

            // 메시지, 참여자, 채팅방 정보 삭제
            await Promise.all([
                db.Message.destroy({ where: { roomId }, transaction }),
                db.ChatRoomParticipant.destroy({ where: { roomId }, transaction }),
                db.ChatRoom.destroy({ where: { id: roomId }, transaction })
            ]);

            await transaction.commit();
            return { success: true };
        } catch (error) {
            await transaction.rollback();
            throw new Error('채팅방 삭제 실패');
        }
    },

    // 채팅방 설정 업데이트
    updateRoomSettings: async (roomId, data) => {
        try {
            await db.ChatRoom.update(data, {
                where: { id: roomId }
            });
            return { success: true };
        } catch (error) {
            throw new Error('채팅방 설정 업데이트 실패');
        }
    },

    // 채팅방 이름 변경
    updateRoomName: async (roomId, data) => {
        try {
            await db.ChatRoom.update(
                { name: data.roomName },
                { where: { id: roomId } }
            );
            return { success: true };
        } catch (error) {
            throw new Error('채팅방 이름 변경 실패');
        }
    },

    // 채팅방 참여자 관리
    updateParticipants: async (roomId, data) => {
        const transaction = await db.sequelize.transaction();
        try {
            // 기존 참여자 삭제
            await db.ChatRoomParticipant.destroy({
                where: { roomId },
                transaction
            });

            // 새로운 참여자 추가
            await db.ChatRoomParticipant.bulkCreate(
                data.participants.map(userId => ({
                    roomId,
                    userId
                })),
                { transaction }
            );

            await transaction.commit();
            return { success: true };
        } catch (error) {
            await transaction.rollback();
            throw new Error('채팅방 참여자 업데이트 실패');
        }
    },

    // 메시지 중요 표시 토글
    toggleImportant: async (messageId) => {
        try {
            const message = await db.Message.findByPk(messageId);
            const isImportant = !message.isImportant;

            await message.update({ isImportant });
            return { success: true, isImportant };
        } catch (error) {
            throw new Error('메시지 중요 표시 토글 실패');
        }
    },

    // 채팅방 상세 정보 조회
    getRoomDetail: async (roomId) => {
        try {
            const roomInfo = await db.ChatRoom.findOne({
                where: { id: roomId },
                include: [{
                    model: db.User,
                    as: 'participants',
                    attributes: ['id', 'name', 'profileImage']
                }],
                attributes: [
                    'id', 'name', 'type', 'notification',
                    'encryption', 'theme', 'createdAt'
                ]
            });

            if (!roomInfo) {
                throw new Error('채팅방을 찾을 수 없습니다');
            }

            return { roomInfo };
        } catch (error) {
            throw new Error('채팅방 상세 정보 조회 실패');
        }
    }
};

module.exports = chatService;
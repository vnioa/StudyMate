const { DataTypes } = require('sequelize');

// 상수 정의
const CHAT_TYPES = {
    INDIVIDUAL: 'individual',
    GROUP: 'group'
};

const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file'
};

const PARTICIPANT_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member'
};

module.exports = (sequelize) => {
    // ChatRoom 모델 정의
    const ChatRoom = sequelize.define('ChatRoom', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '채팅방 ID'
        },
        type: {
            type: DataTypes.ENUM(Object.values(CHAT_TYPES)),
            allowNull: false,
            comment: '채팅방 유형'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '채팅방 이름'
        },
        lastMessageAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 메시지 시간'
        },
        notification: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '알림 설정'
        },
        encryption: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '암호화 여부'
        },
        theme: {
            type: DataTypes.STRING(50),
            defaultValue: 'default',
            comment: '채팅방 테마'
        },
        isPinned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '고정 여부'
        }
    }, {
        tableName: 'chat_rooms',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['type'] },
            { fields: ['lastMessageAt'] }
        ]
    });

    // Message 모델 정의
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '메시지 ID'
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'chat_rooms',
                key: 'id'
            },
            comment: '채팅방 ID'
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '발신자 회원번호'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '메시지 내용'
        },
        type: {
            type: DataTypes.ENUM(Object.values(MESSAGE_TYPES)),
            defaultValue: MESSAGE_TYPES.TEXT,
            comment: '메시지 유형'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '읽음 여부'
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '읽은 시간'
        },
        isImportant: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '중요 메시지 여부'
        }
    }, {
        tableName: 'messages',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['roomId'] },
            { fields: ['senderId'] },
            { fields: ['isRead'] },
            { fields: ['createdAt'] }
        ]
    });

    // ChatRoomParticipant 모델 정의
    const ChatRoomParticipant = sequelize.define('ChatRoomParticipant', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '참여자 ID'
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'chat_rooms',
                key: 'id'
            },
            comment: '채팅방 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '회원번호'
        },
        lastReadMessageId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'messages',
                key: 'id'
            },
            comment: '마지막으로 읽은 메시지 ID'
        },
        role: {
            type: DataTypes.ENUM(Object.values(PARTICIPANT_ROLES)),
            defaultValue: PARTICIPANT_ROLES.MEMBER,
            comment: '참여자 역할'
        }
    }, {
        tableName: 'chat_room_participants',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['roomId', 'memberId'], unique: true },
            { fields: ['lastReadMessageId'] }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    ChatRoom.associate = (models) => {
        ChatRoom.hasMany(Message, {
            foreignKey: 'roomId',
            as: 'messages',
            onDelete: 'CASCADE'
        });

        ChatRoom.belongsToMany(models.Auth, {
            through: ChatRoomParticipant,
            foreignKey: 'roomId',
            otherKey: 'memberId',
            as: 'participants'
        });

        ChatRoom.hasOne(Message, {
            foreignKey: 'roomId',
            as: 'lastMessage',
            scope: {
                order: [['createdAt', 'DESC']]
            }
        });
    };

    Message.associate = (models) => {
        Message.belongsTo(ChatRoom, {
            foreignKey: 'roomId',
            as: 'room'
        });

        Message.belongsTo(models.Auth, {
            foreignKey: 'senderId',
            as: 'sender'
        });
    };

    ChatRoomParticipant.associate = (models) => {
        ChatRoomParticipant.belongsTo(ChatRoom, {
            foreignKey: 'roomId',
            as: 'room'
        });

        ChatRoomParticipant.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
        });

        ChatRoomParticipant.belongsTo(Message, {
            foreignKey: 'lastReadMessageId',
            as: 'lastReadMessage'
        });
    };

    return {
        ChatRoom,
        Message,
        ChatRoomParticipant,
        CHAT_TYPES,
        MESSAGE_TYPES,
        PARTICIPANT_ROLES
    };
};
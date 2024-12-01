const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // ChatRoom 모델 정의
    const ChatRoom = sequelize.define('ChatRoom', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM('individual', 'group'),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        lastMessageAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        notification: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        encryption: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        theme: {
            type: DataTypes.STRING(50),
            defaultValue: 'default'
        },
        isPinned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'chat_rooms',
        timestamps: true,
        indexes: [
            {
                fields: ['type']
            },
            {
                fields: ['lastMessageAt']
            }
        ]
    });

    // Message 모델 정의
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        roomId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'chat_rooms',
                key: 'id'
            }
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('text', 'image', 'file'),
            defaultValue: 'text'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        isImportant: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'messages',
        timestamps: true,
        indexes: [
            {
                fields: ['roomId']
            },
            {
                fields: ['senderId']
            },
            {
                fields: ['isRead']
            }
        ]
    });

    // ChatRoomParticipant 모델 정의
    const ChatRoomParticipant = sequelize.define('ChatRoomParticipant', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        roomId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'chat_rooms',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        lastReadMessageId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'messages',
                key: 'id'
            }
        },
        role: {
            type: DataTypes.ENUM('admin', 'member'),
            defaultValue: 'member'
        }
    }, {
        tableName: 'chat_room_participants',
        timestamps: true,
        indexes: [
            {
                fields: ['roomId', 'userId'],
                unique: true
            }
        ]
    });

    // 모델 간 관계 설정
    ChatRoom.associate = (models) => {
        ChatRoom.hasMany(models.Message, {
            foreignKey: 'roomId',
            as: 'messages',
            onDelete: 'CASCADE'
        });

        ChatRoom.belongsToMany(models.User, {
            through: ChatRoomParticipant,
            foreignKey: 'roomId',
            as: 'participants'
        });

        ChatRoom.hasOne(models.Message, {
            foreignKey: 'roomId',
            as: 'lastMessage',
            scope: {
                order: [['createdAt', 'DESC']]
            }
        });
    };

    Message.associate = (models) => {
        Message.belongsTo(models.ChatRoom, {
            foreignKey: 'roomId',
            as: 'room'
        });

        Message.belongsTo(models.User, {
            foreignKey: 'senderId',
            as: 'sender'
        });
    };

    ChatRoomParticipant.associate = (models) => {
        ChatRoomParticipant.belongsTo(models.ChatRoom, {
            foreignKey: 'roomId'
        });

        ChatRoomParticipant.belongsTo(models.User, {
            foreignKey: 'userId'
        });

        ChatRoomParticipant.belongsTo(models.Message, {
            foreignKey: 'lastReadMessageId',
            as: 'lastReadMessage'
        });
    };

    return {
        ChatRoom,
        Message,
        ChatRoomParticipant
    };
};
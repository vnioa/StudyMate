const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Friend 모델 정의
    const Friend = sequelize.define('Friend', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        friendId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        group: {
            type: DataTypes.STRING(50),
            defaultValue: '기본'
        },
        isBlocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isHidden: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'friends',
        timestamps: true,
        indexes: [
            {
                fields: ['userId', 'friendId'],
                unique: true
            }
        ]
    });

    // FriendRequest 모델 정의
    const FriendRequest = sequelize.define('FriendRequest', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        receiverId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
            defaultValue: 'pending'
        },
        message: {
            type: DataTypes.STRING(200),
            allowNull: true
        }
    }, {
        tableName: 'friend_requests',
        timestamps: true,
        indexes: [
            {
                fields: ['senderId', 'receiverId'],
                unique: true,
                where: {
                    status: 'pending'
                }
            }
        ]
    });

    // FriendSettings 모델 정의
    const FriendSettings = sequelize.define('FriendSettings', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        allowFriendRequests: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        showOnlineStatus: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        autoAcceptRequests: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        notifyNewRequests: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'friend_settings',
        timestamps: true
    });

    // FriendGroup 모델 정의
    const FriendGroup = sequelize.define('FriendGroup', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'friend_groups',
        timestamps: true,
        indexes: [
            {
                fields: ['userId', 'name'],
                unique: true
            }
        ]
    });

    // 모델 간 관계 설정
    Friend.associate = (models) => {
        Friend.belongsTo(models.User, {
            as: 'user',
            foreignKey: 'userId'
        });

        Friend.belongsTo(models.User, {
            as: 'friendUser',
            foreignKey: 'friendId'
        });
    };

    FriendRequest.associate = (models) => {
        FriendRequest.belongsTo(models.User, {
            as: 'sender',
            foreignKey: 'senderId'
        });

        FriendRequest.belongsTo(models.User, {
            as: 'receiver',
            foreignKey: 'receiverId'
        });
    };

    FriendSettings.associate = (models) => {
        FriendSettings.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    FriendGroup.associate = (models) => {
        FriendGroup.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    return {
        Friend,
        FriendRequest,
        FriendSettings,
        FriendGroup
    };
};
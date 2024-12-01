const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Notification 모델 정의
    const Notification = sequelize.define('Notification', {
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
        type: {
            type: DataTypes.ENUM(
                'study',
                'group',
                'friend',
                'achievement',
                'system',
                'mentor'
            ),
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '알림과 관련된 추가 데이터'
        },
        priority: {
            type: DataTypes.ENUM('high', 'medium', 'low'),
            defaultValue: 'medium'
        }
    }, {
        tableName: 'notifications',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['type']
            },
            {
                fields: ['isRead']
            }
        ]
    });

    // FCMToken 모델 정의
    const FCMToken = sequelize.define('FCMToken', {
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
        token: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        deviceType: {
            type: DataTypes.ENUM('ios', 'android', 'web'),
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastUsed: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'fcm_tokens',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['token'],
                unique: true
            }
        ]
    });

    // NotificationSetting 모델 정의
    const NotificationSetting = sequelize.define('NotificationSetting', {
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
        studyNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        groupNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        friendNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        achievementNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        emailNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        pushNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'notification_settings',
        timestamps: true
    });

    // 모델 간 관계 설정
    Notification.associate = (models) => {
        Notification.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    FCMToken.associate = (models) => {
        FCMToken.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    NotificationSetting.associate = (models) => {
        NotificationSetting.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return {
        Notification,
        FCMToken,
        NotificationSetting
    };
};
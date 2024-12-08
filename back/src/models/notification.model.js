const { DataTypes } = require('sequelize');

// 상수 정의
const NOTIFICATION_TYPES = {
    STUDY: 'study',
    GROUP: 'group',
    FRIEND: 'friend',
    ACHIEVEMENT: 'achievement',
    SYSTEM: 'system',
    MENTOR: 'mentor'
};

const PRIORITY_LEVELS = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

const DEVICE_TYPES = {
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web'
};

module.exports = (sequelize) => {
    // Notification 모델 정의
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '알림 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        type: {
            type: DataTypes.ENUM(Object.values(NOTIFICATION_TYPES)),
            allowNull: false,
            comment: '알림 유형'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 200]
            },
            comment: '알림 제목'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '알림 내용'
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
        data: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidData(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('추가 데이터는 객체 형태여야 합니다.');
                    }
                }
            },
            comment: '알림 관련 추가 데이터'
        },
        priority: {
            type: DataTypes.ENUM(Object.values(PRIORITY_LEVELS)),
            defaultValue: PRIORITY_LEVELS.MEDIUM,
            comment: '알림 우선순위'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfterNow(value) {
                    if (value && value <= new Date()) {
                        throw new Error('만료 시간은 현재 시간 이후여야 합니다.');
                    }
                }
            },
            comment: '알림 만료 시간'
        }
    }, {
        tableName: 'notifications',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['type', 'priority'] },
            { fields: ['isRead', 'createdAt'] }
        ],
        scopes: {
            unread: {
                where: { isRead: false }
            },
            priority: {
                where: { priority: PRIORITY_LEVELS.HIGH }
            }
        }
    });

    // FCMToken 모델 정의
    const FCMToken = sequelize.define('FCMToken', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'FCM 토큰 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        token: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: 'FCM 토큰'
        },
        deviceType: {
            type: DataTypes.ENUM(Object.values(DEVICE_TYPES)),
            allowNull: false,
            comment: '기기 유형'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '활성화 여부'
        },
        lastUsed: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: '마지막 사용 시간'
        },
        deviceInfo: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidDeviceInfo(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('기기 정보는 객체 형태여야 합니다.');
                    }
                }
            },
            comment: '기기 정보'
        }
    }, {
        tableName: 'fcm_tokens',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['token'], unique: true },
            { fields: ['isActive', 'lastUsed'] }
        ]
    });

    // NotificationSetting 모델 정의
    const NotificationSetting = sequelize.define('NotificationSetting', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '알림 설정 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        studyNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '학습 알림 설정'
        },
        groupNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '그룹 알림 설정'
        },
        friendNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '친구 알림 설정'
        },
        achievementNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '업적 알림 설정'
        },
        emailNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '이메일 알림 설정'
        },
        pushNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '푸시 알림 설정'
        },
        quietHours: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidQuietHours(value) {
                    if (value && !Array.isArray(value)) {
                        throw new Error('방해금지 시간은 배열 형태여야 합니다.');
                    }
                }
            },
            comment: '방해금지 시간 설정'
        }
    }, {
        tableName: 'notification_settings',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'], unique: true }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    Notification.associate = (models) => {
        Notification.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    FCMToken.associate = (models) => {
        FCMToken.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    NotificationSetting.associate = (models) => {
        NotificationSetting.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return {
        Notification,
        FCMToken,
        NotificationSetting,
        NOTIFICATION_TYPES,
        PRIORITY_LEVELS,
        DEVICE_TYPES
    };
};
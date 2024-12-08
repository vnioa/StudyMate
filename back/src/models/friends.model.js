const { DataTypes } = require('sequelize');

// 상수 정의
const REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
};

module.exports = (sequelize) => {
    // Friend 모델 정의
    const Friend = sequelize.define('Friend', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '친구 관계 ID'
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
        friendId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '친구 회원번호'
        },
        group: {
            type: DataTypes.STRING(50),
            defaultValue: '기본',
            comment: '친구 그룹'
        },
        isBlocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '차단 여부'
        },
        isHidden: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '숨김 여부'
        }
    }, {
        tableName: 'friends',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['memberId', 'friendId'],
                unique: true
            }
        ]
    });

    // FriendRequest 모델 정의
    const FriendRequest = sequelize.define('FriendRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '친구 요청 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '요청자 회원번호'
        },
        friendId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '수신자 회원번호'
        },
        status: {
            type: DataTypes.ENUM(Object.values(REQUEST_STATUS)),
            defaultValue: REQUEST_STATUS.PENDING,
            comment: '요청 상태'
        },
        message: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: '요청 메시지'
        }
    }, {
        tableName: 'friend_requests',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['memberId', 'friendId'],
                unique: true,
                where: {
                    status: REQUEST_STATUS.PENDING
                }
            }
        ]
    });

    // FriendSettings 모델 정의
    const FriendSettings = sequelize.define('FriendSettings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '친구 설정 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '회원번호'
        },
        allowFriendRequests: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '친구 요청 허용'
        },
        showOnlineStatus: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '온라인 상태 표시'
        },
        autoAcceptRequests: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '자동 수락'
        },
        notifyNewRequests: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '새 요청 알림'
        }
    }, {
        tableName: 'friend_settings',
        timestamps: true,
        paranoid: true
    });

    // FriendGroup 모델 정의
    const FriendGroup = sequelize.define('FriendGroup', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '친구 그룹 ID'
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
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '그룹명'
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '정렬 순서'
        }
    }, {
        tableName: 'friend_groups',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['memberId', 'name'],
                unique: true
            }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    Friend.associate = (models) => {
        Friend.belongsTo(models.Auth, {
            as: 'member',
            foreignKey: 'memberId'
        });

        Friend.belongsTo(models.Auth, {
            as: 'friendMember',
            foreignKey: 'friendId'
        });
    };

    FriendRequest.associate = (models) => {
        FriendRequest.belongsTo(models.Auth, {
            as: 'sender',
            foreignKey: 'memberId'
        });

        FriendRequest.belongsTo(models.Auth, {
            as: 'receiver',
            foreignKey: 'friendId'
        });
    };

    FriendSettings.associate = (models) => {
        FriendSettings.belongsTo(models.Auth, {
            foreignKey: 'memberId'
        });
    };

    FriendGroup.associate = (models) => {
        FriendGroup.belongsTo(models.Auth, {
            foreignKey: 'memberId'
        });
    };

    return {
        Friend,
        FriendRequest,
        FriendSettings,
        FriendGroup,
        REQUEST_STATUS
    };
};
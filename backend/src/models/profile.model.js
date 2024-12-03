const { DataTypes } = require('sequelize');

// 상수 정의
const VISIBILITY_TYPES = {
    PUBLIC: 'public',
    FRIENDS: 'friends',
    PRIVATE: 'private'
};

const ACTIVITY_STATUS = {
    ACTIVE: 'active',
    AWAY: 'away',
    BUSY: 'busy',
    OFFLINE: 'offline'
};

module.exports = (sequelize) => {
    const Profile = sequelize.define('Profile', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '프로필 ID'
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
        statusMessage: {
            type: DataTypes.STRING(200),
            allowNull: true,
            validate: {
                len: [0, 200]
            },
            comment: '상태 메시지'
        },
        lastActive: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            comment: '마지막 활동 시간'
        },
        isOnline: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '온라인 상태'
        },
        profileImage: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: '프로필 이미지 URL'
        },
        backgroundImage: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: '배경 이미지 URL'
        },
        nickname: {
            type: DataTypes.STRING(50),
            allowNull: true,
            validate: {
                len: [2, 50]
            },
            comment: '닉네임'
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 1000]
            },
            comment: '자기소개'
        },
        visibility: {
            type: DataTypes.ENUM(Object.values(VISIBILITY_TYPES)),
            defaultValue: VISIBILITY_TYPES.PUBLIC,
            comment: '프로필 공개 범위'
        },
        lastLocationUpdate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 위치 업데이트 시간'
        },
        activeStatus: {
            type: DataTypes.ENUM(Object.values(ACTIVITY_STATUS)),
            defaultValue: ACTIVITY_STATUS.OFFLINE,
            comment: '활동 상태'
        }
    }, {
        tableName: 'profiles',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'], unique: true },
            { fields: ['isOnline', 'lastActive'] },
            { fields: ['visibility'] },
            { fields: ['nickname'] }
        ],
        scopes: {
            public: {
                where: {
                    visibility: VISIBILITY_TYPES.PUBLIC
                }
            },
            active: {
                where: {
                    isOnline: true
                }
            },
            withoutSensitive: {
                attributes: {
                    exclude: ['location', 'lastLocationUpdate']
                }
            }
        }
    });

    Profile.associate = (models) => {
        Profile.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    // 인스턴스 메소드
    Profile.prototype.updateLastActive = async function() {
        this.lastActive = new Date();
        return this.save();
    };

    Profile.prototype.toggleOnlineStatus = async function(status) {
        this.isOnline = status;
        this.lastActive = new Date();
        return this.save();
    };

    return {
        Profile,
        VISIBILITY_TYPES,
        ACTIVITY_STATUS
    };
};
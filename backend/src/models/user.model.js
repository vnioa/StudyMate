const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // User 모델 정의
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [4, 50]
            }
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^[0-9]{10,11}$/
            }
        },
        birthdate: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        profileImage: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        backgroundImage: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        paranoid: true
    });

    // UserSocialAccount 모델 정의
    const UserSocialAccount = sequelize.define('UserSocialAccount', {
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
        provider: {
            type: DataTypes.ENUM('google', 'kakao'),
            allowNull: false
        },
        socialId: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        isPrimary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        accessToken: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        tokenExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'user_social_accounts',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['provider', 'socialId'],
                unique: true
            }
        ]
    });

    // UserPrivacySettings 모델 정의
    const UserPrivacySettings = sequelize.define('UserPrivacySettings', {
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
        profileVisibility: {
            type: DataTypes.ENUM('public', 'friends', 'private'),
            defaultValue: 'public'
        },
        activityVisibility: {
            type: DataTypes.ENUM('public', 'friends', 'private'),
            defaultValue: 'public'
        },
        searchable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        allowFriendRequests: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'user_privacy_settings',
        timestamps: true
    });

    // 모델 간 관계 설정
    User.associate = (models) => {
        User.hasMany(UserSocialAccount, {
            foreignKey: 'userId',
            as: 'socialAccounts'
        });

        User.hasOne(UserPrivacySettings, {
            foreignKey: 'userId',
            as: 'privacySettings'
        });
    };

    UserSocialAccount.associate = (models) => {
        UserSocialAccount.belongsTo(User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    UserPrivacySettings.associate = (models) => {
        UserPrivacySettings.belongsTo(User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return {
        User,
        UserSocialAccount,
        UserPrivacySettings
    };
};
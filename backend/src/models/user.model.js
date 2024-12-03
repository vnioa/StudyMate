const { DataTypes } = require('sequelize');

// 상수 정의
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
};

const SOCIAL_PROVIDERS = {
    NAVER: 'naver',
    KAKAO: 'kakao'
};

module.exports = (sequelize) => {
    // User 모델 정의
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            comment: '회원번호'
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [4, 50]
            },
            comment: '사용자 아이디'
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
                notEmpty: true
            },
            comment: '이메일'
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                len: [8, 255]
            },
            comment: '비밀번호'
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50]
            },
            comment: '사용자 이름'
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^[0-9]{10,11}$/
            },
            comment: '전화번호'
        },
        birthdate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            validate: {
                isDate: true,
                isBefore: new Date().toISOString()
            },
            comment: '생년월일'
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
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 1000]
            },
            comment: '자기소개'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '프로필 공개 여부'
        },
        status: {
            type: DataTypes.ENUM(Object.values(USER_STATUS)),
            defaultValue: USER_STATUS.ACTIVE,
            comment: '계정 상태'
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 로그인 시간'
        },
        loginIp: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '마지막 로그인 IP'
        },
        role: {
            type: DataTypes.ENUM(Object.values(USER_ROLES)),
            defaultValue: USER_ROLES.USER,
            comment: '사용자 권한'
        }
    }, {
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['email'] },
            { fields: ['username'] },
            { fields: ['status'] }
        ],
        scopes: {
            active: {
                where: { status: USER_STATUS.ACTIVE }
            },
            public: {
                where: { isPublic: true }
            },
            withoutSensitive: {
                attributes: {
                    exclude: ['password', 'loginIp']
                }
            }
        }
    });

    // UserSocialAccount 모델 정의
    const UserSocialAccount = sequelize.define('UserSocialAccount', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '소셜 계정 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        provider: {
            type: DataTypes.ENUM(Object.values(SOCIAL_PROVIDERS)),
            allowNull: false,
            comment: '소셜 제공자'
        },
        socialId: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '소셜 계정 고유 ID'
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isEmail: true
            },
            comment: '소셜 계정 이메일'
        },
        isPrimary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '주 계정 여부'
        },
        accessToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '액세스 토큰'
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '리프레시 토큰'
        },
        tokenExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '토큰 만료 시간'
        }
    }, {
        tableName: 'user_social_accounts',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['provider', 'socialId'], unique: true }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    User.associate = (models) => {
        User.hasMany(UserSocialAccount, {
            foreignKey: 'memberId',
            as: 'socialAccounts',
            onDelete: 'CASCADE'
        });
    };

    UserSocialAccount.associate = (models) => {
        UserSocialAccount.belongsTo(User, {
            foreignKey: 'memberId',
            as: 'member'
        });
    };

    return {
        User,
        UserSocialAccount,
        USER_STATUS,
        USER_ROLES,
        SOCIAL_PROVIDERS
    };
};
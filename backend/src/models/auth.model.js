const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    const Auth = sequelize.define('Auth', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
            comment: '로그인 아이디'
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
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
        birthdate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isDate: true,
                isBefore: new Date().toISOString()
            },
            comment: '생년월일'
        },
        phoneNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                is: /^[0-9]{10,11}$/,
                notEmpty: true
            },
            comment: '전화번호'
        },
        profileImage: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: '프로필 이미지 경로'
        },
        provider: {
            type: DataTypes.ENUM('local', 'google', 'kakao'),
            defaultValue: 'local',
            comment: '인증 제공자'
        },
        socialId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: '소셜 로그인 ID'
        },
        refreshToken: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: '갱신 토큰'
        },
        authCode: {
            type: DataTypes.STRING(6),
            allowNull: true,
            comment: '인증 코드'
        },
        authCodeExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '인증 코드 만료 시간'
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 로그인 시간'
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active',
            comment: '계정 상태'
        },
        passwordResetToken: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '비밀번호 재설정 토큰'
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '비밀번호 재설정 토큰 만료 시간'
        },
        failedLoginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '로그인 실패 횟수'
        },
        lastPasswordChange: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 비밀번호 변경 시간'
        },
        loginIp: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '마지막 로그인 IP'
        },
        twoFactorEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '2단계 인증 활성화 여부'
        },
        twoFactorSecret: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '2단계 인증 비밀키'
        }
    }, {
        tableName: 'auth',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['email'],
                name: 'idx_auth_email'
            },
            {
                unique: true,
                fields: ['username'],
                name: 'idx_auth_username'
            },
            {
                fields: ['provider', 'socialId'],
                name: 'idx_auth_provider_social'
            },
            {
                fields: ['status'],
                name: 'idx_auth_status'
            }
        ],
        scopes: {
            active: {
                where: { status: 'active' }
            },
            withoutSensitive: {
                attributes: {
                    exclude: ['password', 'refreshToken', 'authCode', 'twoFactorSecret', 'passwordResetToken']
                }
            }
        },
        hooks: {
            beforeCreate: async (auth) => {
                if (auth.password) {
                    auth.password = await bcrypt.hash(auth.password, 12);
                    auth.lastPasswordChange = new Date();
                }
            },
            beforeUpdate: async (auth) => {
                if (auth.changed('password')) {
                    auth.password = await bcrypt.hash(auth.password, 12);
                    auth.lastPasswordChange = new Date();
                }
            }
        }
    });

    // 인스턴스 메소드
    Auth.prototype.isValidPassword = async function(password) {
        try {
            if (!this.password) return false;
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            throw new Error('Password validation failed');
        }
    };

    Auth.prototype.incrementFailedAttempts = async function() {
        this.failedLoginAttempts += 1;
        if (this.failedLoginAttempts >= 5) {
            this.status = 'suspended';
            this.lastLogin = new Date();
        }
        return this.save();
    };

    Auth.prototype.resetFailedAttempts = async function() {
        this.failedLoginAttempts = 0;
        this.lastLogin = new Date();
        return this.save();
    };

    Auth.prototype.updateLoginInfo = async function(ip) {
        this.lastLogin = new Date();
        this.loginIp = ip;
        return this.save();
    };

    // 정적 메소드
    Auth.generateAuthCode = function() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료
        return { code, expires };
    };

    Auth.prototype.isAccountLocked = function() {
        return this.status === 'suspended' || this.failedLoginAttempts >= 5;
    };

    return Auth;
};
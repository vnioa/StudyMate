const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Auth = sequelize.define('Auth', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [4, 50]
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        birthdate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        phoneNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                is: /^[0-9]{10,11}$/
            }
        },
        profileImage: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        provider: {
            type: DataTypes.ENUM('local', 'google', 'kakao'),
            defaultValue: 'local'
        },
        socialId: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        refreshToken: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        authCode: {
            type: DataTypes.STRING(6),
            allowNull: true
        },
        authCodeExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'auth',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId']
            },
            {
                unique: true,
                fields: ['email']
            },
            {
                unique: true,
                fields: ['username']
            },
            {
                fields: ['provider', 'socialId']
            }
        ]
    });

    Auth.associate = (models) => {
        // 필요한 경우 다른 모델과의 관계 정의
        // 예: User 모델과의 관계
        Auth.belongsTo(models.User, {
            foreignKey: 'userId',
            targetKey: 'id',
            onDelete: 'CASCADE'
        });
    };

    // 인스턴스 메소드
    Auth.prototype.isValidPassword = async function(password) {
        // 비밀번호 검증 로직 구현
        return await bcrypt.compare(password, this.password);
    };

    // 정적 메소드
    Auth.generateAuthCode = function() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    return Auth;
};
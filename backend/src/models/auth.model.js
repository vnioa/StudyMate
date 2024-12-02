const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    const Auth = sequelize.define('Auth', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        },
        passwordResetToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        failedLoginAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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
    }, {
        hooks: {
            beforeCreate: async (auth) => {
                if(auth.password){
                    auth.password = await bcrypt.hash(auth.password, 12);
                }
            },
            beforeUpdate: async(auth) => {
                if(auth.changed('password')){
                    auth.password = await bcrypt.hash(auth.password, 12);
                }
            }
        }
    });

    Auth.associate = (models) => {
        Auth.belongsTo(models.User, {
            foreignKey: 'userId',
            targetKey: 'id',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    // 인스턴스 메소드
    Auth.prototype.isvalidPassword = async function(password){
        try{
            return await bcrypt.compare(password, this.password);
        }catch(error){
            throw new Error('Password validation failed');
        }
    };

    // 정적 메소드
    Auth.generateAuthCode = function() {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

        return {code, expires};
    }

    return Auth;
};
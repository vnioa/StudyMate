const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Profile = sequelize.define('Profile', {
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
        statusMessage: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        lastActive: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        isOnline: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        profileImage: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        backgroundImage: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        nickname: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        visibility: {
            type: DataTypes.ENUM('public', 'friends', 'private'),
            defaultValue: 'public'
        }
    }, {
        tableName: 'profiles',
        timestamps: true,
        indexes: [
            {
                fields: ['userId'],
                unique: true
            },
            {
                fields: ['isOnline']
            }
        ]
    });

    Profile.associate = (models) => {
        Profile.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });
    };

    return Profile;
};
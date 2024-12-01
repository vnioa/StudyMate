const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Level 모델 정의
    const Level = sequelize.define('Level', {
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
        currentLevel: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        currentXP: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        totalXP: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        studyStreak: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        lastActivityDate: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'levels',
        timestamps: true,
        indexes: [
            {
                fields: ['userId'],
                unique: true
            },
            {
                fields: ['currentLevel']
            }
        ]
    });

    // LevelRequirement 모델 정의
    const LevelRequirement = sequelize.define('LevelRequirement', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requiredXP: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        rewards: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'level_requirements',
        timestamps: true
    });

    // ExperienceLog 모델 정의
    const ExperienceLog = sequelize.define('ExperienceLog', {
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
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        levelUpOccurred: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'experience_logs',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['type']
            }
        ]
    });

    // 모델 간 관계 설정
    Level.associate = (models) => {
        Level.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    ExperienceLog.associate = (models) => {
        ExperienceLog.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return {
        Level,
        LevelRequirement,
        ExperienceLog
    };
};
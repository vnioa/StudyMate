const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Achievement 모델 정의
    const Achievement = sequelize.define('Achievement', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        category: {
            type: DataTypes.ENUM('study', 'social', 'challenge', 'special'),
            allowNull: false,
            validate: {
                isIn: [['study', 'social', 'challenge', 'special']]
            }
        },
        icon: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        requiredProgress: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        reward: {
            type: DataTypes.JSON,
            allowNull: true
        },
        isHidden: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        difficulty: {
            type: DataTypes.ENUM('easy', 'medium', 'hard'),
            defaultValue: 'medium'
        }
    }, {
        tableName: 'achievements',
        timestamps: true,
        indexes: [
            {
                fields: ['category']
            },
            {
                fields: ['difficulty']
            }
        ]
    });

    // UserAchievement 모델 정의
    const UserAchievement = sequelize.define('UserAchievement', {
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
        achievementId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'achievements',
                key: 'id'
            }
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        isAcquired: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        acquiredAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: 'user_achievements',
        timestamps: true,
        indexes: [
            {
                fields: ['userId', 'achievementId'],
                unique: true
            },
            {
                fields: ['isAcquired']
            }
        ]
    });

    // AchievementHistory 모델 정의
    const AchievementHistory = sequelize.define('AchievementHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userAchievementId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'user_achievements',
                key: 'id'
            }
        },
        progressChange: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: true
            }
        },
        action: {
            type: DataTypes.ENUM('progress', 'acquire'),
            allowNull: false
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'achievement_history',
        timestamps: true
    });

    // 모델 간 관계 설정
    Achievement.associate = (models) => {
        Achievement.belongsToMany(models.User, {
            through: UserAchievement,
            foreignKey: 'achievementId',
            as: 'users'
        });
    };

    UserAchievement.associate = (models) => {
        UserAchievement.belongsTo(models.User, {
            foreignKey: 'userId'
        });

        UserAchievement.belongsTo(Achievement, {
            foreignKey: 'achievementId'
        });

        UserAchievement.hasMany(AchievementHistory, {
            foreignKey: 'userAchievementId',
            as: 'history'
        });
    };

    AchievementHistory.associate = (models) => {
        AchievementHistory.belongsTo(UserAchievement, {
            foreignKey: 'userAchievementId'
        });
    };

    return {
        Achievement,
        UserAchievement,
        AchievementHistory
    };
};
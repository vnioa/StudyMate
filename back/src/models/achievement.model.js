const { DataTypes } = require('sequelize');

// 상수 정의
const ACHIEVEMENT_CATEGORIES = {
    STUDY: 'study',
    SOCIAL: 'social',
    CHALLENGE: 'challenge',
    SPECIAL: 'special'
};

const DIFFICULTY_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

const HISTORY_ACTIONS = {
    PROGRESS: 'progress',
    ACQUIRE: 'acquire'
};

module.exports = (sequelize) => {
    // Achievement 모델 정의
    const Achievement = sequelize.define('Achievement', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            comment: '업적 ID'
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [10, 1000]
            }
        },
        category: {
            type: DataTypes.ENUM(Object.values(ACHIEVEMENT_CATEGORIES)),
            allowNull: false,
            validate: {
                isIn: [Object.values(ACHIEVEMENT_CATEGORIES)]
            }
        },
        icon: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            }
        },
        requiredProgress: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 1000
            }
        },
        reward: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidReward(value) {
                    if (value && (!value.type || !value.amount)) {
                        throw new Error('Reward must have type and amount');
                    }
                }
            }
        },
        isHidden: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        difficulty: {
            type: DataTypes.ENUM(Object.values(DIFFICULTY_LEVELS)),
            defaultValue: DIFFICULTY_LEVELS.MEDIUM
        }
    }, {
        tableName: 'achievements',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['category'] },
            { fields: ['difficulty'] }
        ]
    });

    // UserAchievement 모델 정의
    const UserAchievement = sequelize.define('UserAchievement', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            comment: '사용자 업적 ID'
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
        achievementId: {
            type: DataTypes.INTEGER,
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
        paranoid: true,
        indexes: [
            {
                fields: ['memberId', 'achievementId'],
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
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            comment: '업적 히스토리 ID'
        },
        userAchievementId: {
            type: DataTypes.INTEGER,
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
                notNull: true,
                notZero(value) {
                    if (value === 0) {
                        throw new Error('Progress change cannot be zero');
                    }
                }
            }
        },
        action: {
            type: DataTypes.ENUM(Object.values(HISTORY_ACTIONS)),
            allowNull: false
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        tableName: 'achievement_history',
        timestamps: true,
        indexes: [
            { fields: ['userAchievementId'] },
            { fields: ['action'] }
        ]
    });

    // 모델 간 관계 설정
    Achievement.associate = (models) => {
        Achievement.belongsToMany(models.Auth, {
            through: UserAchievement,
            foreignKey: 'achievementId',
            otherKey: 'memberId',
            as: 'users'
        });
    };

    UserAchievement.associate = (models) => {
        UserAchievement.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            targetKey: 'id'
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
        AchievementHistory,
        ACHIEVEMENT_CATEGORIES,
        DIFFICULTY_LEVELS,
        HISTORY_ACTIONS
    };
};
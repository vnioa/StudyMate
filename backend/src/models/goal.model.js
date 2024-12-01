const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Goal 모델 정의
    const Goal = sequelize.define('Goal', {
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
        title: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        category: {
            type: DataTypes.ENUM('short', 'mid', 'long'),
            allowNull: false
        },
        deadline: {
            type: DataTypes.DATE,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'completed', 'archived'),
            defaultValue: 'active'
        }
    }, {
        tableName: 'goals',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['category']
            },
            {
                fields: ['status']
            }
        ]
    });

    // GoalCategory 모델 정의
    const GoalCategory = sequelize.define('GoalCategory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true
        }
    }, {
        tableName: 'goal_categories',
        timestamps: true
    });

    // GoalProgress 모델 정의
    const GoalProgress = sequelize.define('GoalProgress', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        goalId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'goals',
                key: 'id'
            }
        },
        progressValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 100
            }
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'goal_progress',
        timestamps: true,
        indexes: [
            {
                fields: ['goalId']
            }
        ]
    });

    // 모델 간 관계 설정
    Goal.associate = (models) => {
        Goal.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });

        Goal.hasMany(GoalProgress, {
            foreignKey: 'goalId',
            as: 'progressHistory'
        });
    };

    GoalProgress.associate = (models) => {
        GoalProgress.belongsTo(Goal, {
            foreignKey: 'goalId',
            as: 'goal'
        });
    };

    return {
        Goal,
        GoalCategory,
        GoalProgress
    };
};
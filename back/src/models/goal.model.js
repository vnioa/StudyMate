const { DataTypes } = require('sequelize');

// 상수 정의
const GOAL_CATEGORIES = {
    SHORT: 'short',
    MID: 'mid',
    LONG: 'long'
};

const GOAL_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
};

module.exports = (sequelize) => {
    // Goal 모델 정의
    const Goal = sequelize.define('Goal', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '목표 ID'
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
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 200]
            },
            comment: '목표 제목'
        },
        category: {
            type: DataTypes.ENUM(Object.values(GOAL_CATEGORIES)),
            allowNull: false,
            comment: '카테고리'
        },
        deadline: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '마감 기한'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '목표 설명'
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100
            },
            comment: '진척도 (%)'
        },
        status: {
            type: DataTypes.ENUM(Object.values(GOAL_STATUS)),
            defaultValue: GOAL_STATUS.ACTIVE,
            comment: '상태'
        }
    }, {
        tableName: 'goals',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['category'] },
            { fields: ['status'] }
        ]
    });

    // GoalCategory 모델 정의
    const GoalCategory = sequelize.define('GoalCategory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '목표 카테고리 ID'
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [2, 50]
            },
            comment: '카테고리 이름'
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: '카테고리 설명'
        }
    }, {
        tableName: 'goal_categories',
        timestamps: true,
        paranoid: true
    });

    // GoalProgress 모델 정의
    const GoalProgress = sequelize.define('GoalProgress', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '목표 진행 상황 ID'
        },
        goalId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'goals',
                key: 'id'
            },
            comment: '연결된 목표 ID'
        },
        progressValue: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 100
            },
            comment: '진척도 증가량'
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '메모'
        }
    }, {
        tableName: 'goal_progress',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['goalId'] }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    Goal.associate = (models) => {
        Goal.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
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
        GoalProgress,
        GOAL_CATEGORIES,
        GOAL_STATUS
    };
};
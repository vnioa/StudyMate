const { DataTypes } = require('sequelize');

// 상수 정의
const EXPERIENCE_TYPES = {
    STUDY: 'study',
    ACHIEVEMENT: 'achievement',
    QUEST: 'quest',
    BONUS: 'bonus',
    PENALTY: 'penalty'
};

const LEVEL_CONSTRAINTS = {
    MIN_LEVEL: 1,
    MAX_LEVEL: 100,
    MIN_XP: 0
};

module.exports = (sequelize) => {
    // Level 모델 정의
    const Level = sequelize.define('Level', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '레벨 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        currentLevel: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: LEVEL_CONSTRAINTS.MIN_LEVEL,
            validate: {
                min: LEVEL_CONSTRAINTS.MIN_LEVEL,
                max: LEVEL_CONSTRAINTS.MAX_LEVEL
            },
            comment: '현재 레벨'
        },
        currentXP: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: LEVEL_CONSTRAINTS.MIN_XP,
            validate: {
                min: LEVEL_CONSTRAINTS.MIN_XP
            },
            comment: '현재 경험치'
        },
        totalXP: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: LEVEL_CONSTRAINTS.MIN_XP,
            validate: {
                min: LEVEL_CONSTRAINTS.MIN_XP
            },
            comment: '총 획득 경험치'
        },
        studyStreak: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '연속 학습일'
        },
        lastActivityDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '마지막 활동 일시'
        },
        maxStreak: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '최대 연속 학습일'
        },
        achievements: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidAchievements(value) {
                    if (value && !Array.isArray(value)) {
                        throw new Error('업적 목록은 배열 형태여야 합니다.');
                    }
                }
            },
            comment: '획득한 업적 목록'
        }
    }, {
        tableName: 'levels',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'], unique: true },
            { fields: ['currentLevel', 'totalXP'] },
            { fields: ['studyStreak'] }
        ]
    });

    // LevelRequirement 모델 정의
    const LevelRequirement = sequelize.define('LevelRequirement', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '레벨 요구사항 ID'
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: LEVEL_CONSTRAINTS.MIN_LEVEL,
                max: LEVEL_CONSTRAINTS.MAX_LEVEL
            },
            comment: '레벨'
        },
        requiredXP: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: LEVEL_CONSTRAINTS.MIN_XP,
                isValidRequirement(value) {
                    if (value <= 0) {
                        throw new Error('필요 경험치는 0보다 커야 합니다.');
                    }
                }
            },
            comment: '필요 경험치'
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 200]
            },
            comment: '레벨 설명'
        },
        rewards: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidRewards(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('보상 정보는 객체 형태여야 합니다.');
                    }
                }
            },
            comment: '레벨업 보상'
        },
        unlockables: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidUnlockables(value) {
                    if (value && !Array.isArray(value)) {
                        throw new Error('잠금 해제 항목은 배열 형태여야 합니다.');
                    }
                }
            },
            comment: '잠금 해제 항목'
        }
    }, {
        tableName: 'level_requirements',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['level'], unique: true }
        ]
    });

    // ExperienceLog 모델 정의
    const ExperienceLog = sequelize.define('ExperienceLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '경험치 로그 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: true,
                min: 1
            },
            comment: '획득/손실 경험치'
        },
        type: {
            type: DataTypes.ENUM(Object.values(EXPERIENCE_TYPES)),
            allowNull: false,
            comment: '경험치 획득 유형'
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true,
            validate: {
                len: [0, 200]
            },
            comment: '상세 설명'
        },
        levelUpOccurred: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '레벨업 발생 여부'
        },
        previousLevel: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '이전 레벨'
        },
        newLevel: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '새로운 레벨'
        }
    }, {
        tableName: 'experience_logs',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['type', 'createdAt'] },
            { fields: ['levelUpOccurred'] }
        ]
    });

    // 모델 간 관계 설정
    Level.associate = (models) => {
        Level.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    ExperienceLog.associate = (models) => {
        ExperienceLog.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return {
        Level,
        LevelRequirement,
        ExperienceLog,
        EXPERIENCE_TYPES,
        LEVEL_CONSTRAINTS
    };
};
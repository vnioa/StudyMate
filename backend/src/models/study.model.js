const { DataTypes } = require('sequelize');

// 상수 정의
const SESSION_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed'
};

const MOOD_TYPES = {
    GREAT: 'great',
    GOOD: 'good',
    NEUTRAL: 'neutral',
    BAD: 'bad',
    TERRIBLE: 'terrible'
};

const MATERIAL_TYPES = {
    DOCUMENT: 'document',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    OTHER: 'other'
};

module.exports = (sequelize) => {
    // StudySession 모델 정의
    const StudySession = sequelize.define('StudySession', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '학습 세션 ID'
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
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '학습 시작 시간'
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '학습 종료 시간'
        },
        totalTime: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '총 학습 시간(분)'
        },
        cycles: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '학습 사이클 수'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '학습 노트'
        },
        focusMode: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidFocusMode(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('집중 모드 설정은 객체 형태여야 합니다.');
                    }
                }
            },
            comment: '집중 모드 설정'
        },
        status: {
            type: DataTypes.ENUM(Object.values(SESSION_STATUS)),
            defaultValue: SESSION_STATUS.ACTIVE,
            comment: '세션 상태'
        }
    }, {
        tableName: 'study_sessions',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['startTime'] }
        ]
    });

    // StudySchedule 모델 정의
    const StudySchedule = sequelize.define('StudySchedule', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '학습 일정 ID'
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
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 200]
            },
            comment: '일정 제목'
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '시작 시간'
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isAfterStart(value) {
                    if (value <= this.startTime) {
                        throw new Error('종료 시간은 시작 시간 이후여야 합니다.');
                    }
                }
            },
            comment: '종료 시간'
        },
        repeat: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '반복 여부'
        },
        repeatPattern: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidPattern(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('반복 패턴은 객체 형태여야 합니다.');
                    }
                }
            },
            comment: '반복 패턴'
        },
        notification: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '알림 여부'
        },
        shared: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '공유 여부'
        }
    }, {
        tableName: 'study_schedules',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['startTime', 'endTime'] }
        ]
    });

    // StudyJournal 모델 정의
    const StudyJournal = sequelize.define('StudyJournal', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '학습 일지 ID'
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
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 200]
            },
            comment: '일지 제목'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '학습 내용'
        },
        achievements: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '성취 사항'
        },
        difficulties: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '어려웠던 점'
        },
        improvements: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '개선 사항'
        },
        nextGoals: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '다음 목표'
        },
        mood: {
            type: DataTypes.ENUM(Object.values(MOOD_TYPES)),
            allowNull: true,
            comment: '학습 분위기'
        }
    }, {
        tableName: 'study_journals',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['createdAt'] }
        ]
    });

    // SelfEvaluation 모델 정의
    const SelfEvaluation = sequelize.define('SelfEvaluation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '자기 평가 ID'
        },
        sessionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'study_sessions',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '학습 세션 ID'
        },
        understanding: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            },
            comment: '이해도'
        },
        effort: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            },
            comment: '노력도'
        },
        efficiency: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            },
            comment: '효율성'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '평가 노트'
        }
    }, {
        tableName: 'self_evaluations',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['sessionId'] }
        ]
    });

    // StudyMaterial 모델 정의
    const StudyMaterial = sequelize.define('StudyMaterial', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '학습 자료 ID'
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
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 200]
            },
            comment: '자료 제목'
        },
        type: {
            type: DataTypes.ENUM(Object.values(MATERIAL_TYPES)),
            allowNull: false,
            comment: '자료 유형'
        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                isUrl: true
            },
            comment: '자료 URL'
        },
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: {
                min: 1
            },
            comment: '자료 버전'
        },
        isShared: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '공유 여부'
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            },
            comment: '파일 크기(bytes)'
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'MIME 타입'
        }
    }, {
        tableName: 'study_materials',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['type'] }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    StudySession.associate = (models) => {
        StudySession.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
        StudySession.hasOne(SelfEvaluation, {
            foreignKey: 'sessionId',
            as: 'evaluation',
            onDelete: 'CASCADE'
        });
    };

    StudySchedule.associate = (models) => {
        StudySchedule.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    StudyJournal.associate = (models) => {
        StudyJournal.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    StudyMaterial.associate = (models) => {
        StudyMaterial.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    return {
        StudySession,
        StudySchedule,
        StudyJournal,
        SelfEvaluation,
        StudyMaterial,
        SESSION_STATUS,
        MOOD_TYPES,
        MATERIAL_TYPES
    };
};
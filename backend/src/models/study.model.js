const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // StudySession 모델 정의
    const StudySession = sequelize.define('StudySession', {
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
        startTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true
        },
        totalTime: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '총 학습 시간(분)'
        },
        cycles: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        focusMode: {
            type: DataTypes.JSON,
            allowNull: true
        }
    });

    // StudySchedule 모델 정의
    const StudySchedule = sequelize.define('StudySchedule', {
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
        startTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        repeat: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        notification: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        shared: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    // StudyJournal 모델 정의
    const StudyJournal = sequelize.define('StudyJournal', {
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        achievements: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        difficulties: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        improvements: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        nextGoals: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    });

    // SelfEvaluation 모델 정의
    const SelfEvaluation = sequelize.define('SelfEvaluation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        sessionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'study_sessions',
                key: 'id'
            }
        },
        understanding: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        effort: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        efficiency: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    // StudyMaterial 모델 정의
    const StudyMaterial = sequelize.define('StudyMaterial', {
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
        type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        isShared: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });

    // 모델 간 관계 설정
    StudySession.associate = (models) => {
        StudySession.belongsTo(models.User, {
            foreignKey: 'userId'
        });
        StudySession.hasOne(SelfEvaluation, {
            foreignKey: 'sessionId'
        });
    };

    StudySchedule.associate = (models) => {
        StudySchedule.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    StudyJournal.associate = (models) => {
        StudyJournal.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    StudyMaterial.associate = (models) => {
        StudyMaterial.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    return {
        StudySession,
        StudySchedule,
        StudyJournal,
        SelfEvaluation,
        StudyMaterial
    };
};
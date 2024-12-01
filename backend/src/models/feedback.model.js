const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // SelfEvaluation 모델 정의
    const SelfEvaluation = sequelize.define('SelfEvaluation', {
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
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
    }, {
        tableName: 'self_evaluations',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['date']
            }
        ]
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
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
    }, {
        tableName: 'study_journals',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['date']
            }
        ]
    });

    // 모델 간 관계 설정
    SelfEvaluation.associate = (models) => {
        SelfEvaluation.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    StudyJournal.associate = (models) => {
        StudyJournal.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return {
        SelfEvaluation,
        StudyJournal
    };
};
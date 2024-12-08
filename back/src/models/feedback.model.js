const { DataTypes } = require('sequelize');

// 상수 정의
const RATING_RANGE = {
    MIN: 1,
    MAX: 5
};

module.exports = (sequelize) => {
    // SelfEvaluation 모델 정의
    const SelfEvaluation = sequelize.define('SelfEvaluation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '자가평가 ID'
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '평가 날짜'
        },
        understanding: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: RATING_RANGE.MIN,
                max: RATING_RANGE.MAX
            },
            comment: '이해도 (1-5)'
        },
        effort: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: RATING_RANGE.MIN,
                max: RATING_RANGE.MAX
            },
            comment: '노력도 (1-5)'
        },
        efficiency: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: RATING_RANGE.MIN,
                max: RATING_RANGE.MAX
            },
            comment: '효율성 (1-5)'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '추가 노트'
        }
    }, {
        tableName: 'self_evaluations',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['date'] },
            { fields: ['memberId', 'date'] }
        ]
    });

    // StudyJournal 모델 정의
    const StudyJournal = sequelize.define('StudyJournal', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '학습일지 ID'
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '작성 날짜'
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
        }
    }, {
        tableName: 'study_journals',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['date'] },
            { fields: ['memberId', 'date'] }
        ]
    });

    // 모델 간 관계 설정은 동일하게 유지
    SelfEvaluation.associate = (models) => {
        SelfEvaluation.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
        });
    };

    StudyJournal.associate = (models) => {
        StudyJournal.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
        });
    };

    return {
        SelfEvaluation,
        StudyJournal,
        RATING_RANGE
    };
};
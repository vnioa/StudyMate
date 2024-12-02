const { DataTypes } = require('sequelize');

// 상수 정의
const QUESTION_STATUS = {
    OPEN: 'open',
    CLOSED: 'closed',
    DELETED: 'deleted'
};

const GROUP_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    CLOSED: 'closed'
};

const MENTOR_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

module.exports = (sequelize) => {
    // Question 모델 정의
    const Question = sequelize.define('Question', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '질문 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '작성자 회원번호'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 200]
            },
            comment: '질문 제목'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '질문 내용'
        },
        viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '조회수'
        },
        status: {
            type: DataTypes.ENUM(Object.values(QUESTION_STATUS)),
            defaultValue: QUESTION_STATUS.OPEN,
            comment: '질문 상태'
        }
    }, {
        tableName: 'questions',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['status'] },
            { fields: ['createdAt'] }
        ]
    });

    // Answer 모델 정의
    const Answer = sequelize.define('Answer', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '답변 ID'
        },
        questionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'questions',
                key: 'id'
            },
            comment: '질문 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '답변자 회원번호'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '답변 내용'
        },
        isAccepted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '채택 여부'
        }
    }, {
        tableName: 'answers',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['questionId'] },
            { fields: ['memberId'] }
        ]
    });

    // StudyGroup 모델 정의
    const StudyGroup = sequelize.define('StudyGroup', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '스터디 그룹 ID'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            },
            comment: '그룹명'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '카테고리'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '그룹 설명'
        },
        memberCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: {
                min: 1
            },
            comment: '멤버 수'
        },
        status: {
            type: DataTypes.ENUM(Object.values(GROUP_STATUS)),
            defaultValue: GROUP_STATUS.ACTIVE,
            comment: '그룹 상태'
        }
    }, {
        tableName: 'study_groups',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['category'] },
            { fields: ['status'] }
        ]
    });

    // Mentor 모델 정의
    const Mentor = sequelize.define('Mentor', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            comment: '멘토 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '멘토 회원번호'
        },
        field: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '전문 분야'
        },
        experience: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '경력 사항'
        },
        introduction: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '자기 소개'
        },
        rating: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 5
            },
            comment: '평점'
        },
        status: {
            type: DataTypes.ENUM(Object.values(MENTOR_STATUS)),
            defaultValue: MENTOR_STATUS.ACTIVE,
            comment: '멘토 상태'
        }
    }, {
        tableName: 'mentors',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['field'] },
            { fields: ['status'] }
        ]
    });

    // 모델 간 관계 설정
    Question.associate = (models) => {
        Question.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'author'
        });

        Question.hasMany(Answer, {
            foreignKey: 'questionId',
            as: 'answers'
        });
    };

    Answer.associate = (models) => {
        Answer.belongsTo(Question, {
            foreignKey: 'questionId',
            as: 'question'
        });

        Answer.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'author'
        });
    };

    StudyGroup.associate = (models) => {
        StudyGroup.belongsToMany(models.Auth, {
            through: 'StudyGroupMembers',
            foreignKey: 'groupId',
            otherKey: 'memberId',
            as: 'members'
        });
    };

    Mentor.associate = (models) => {
        Mentor.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member'
        });
    };

    return {
        Question,
        Answer,
        StudyGroup,
        Mentor,
        QUESTION_STATUS,
        GROUP_STATUS,
        MENTOR_STATUS
    };
};
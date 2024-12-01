const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Question 모델 정의
    const Question = sequelize.define('Question', {
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('open', 'closed', 'deleted'),
            defaultValue: 'open'
        }
    }, {
        tableName: 'questions',
        timestamps: true,
        paranoid: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['status']
            }
        ]
    });

    // Answer 모델 정의
    const Answer = sequelize.define('Answer', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        questionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'questions',
                key: 'id'
            }
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
        isAccepted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'answers',
        timestamps: true,
        paranoid: true
    });

    // StudyGroup 모델 정의
    const StudyGroup = sequelize.define('StudyGroup', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        memberCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'closed'),
            defaultValue: 'active'
        }
    }, {
        tableName: 'study_groups',
        timestamps: true
    });

    // Mentor 모델 정의
    const Mentor = sequelize.define('Mentor', {
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
        field: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        experience: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        introduction: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        rating: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
        }
    }, {
        tableName: 'mentors',
        timestamps: true
    });

    // 모델 간 관계 설정
    Question.associate = (models) => {
        Question.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'author'
        });

        Question.hasMany(Answer, {
            foreignKey: 'questionId',
            as: 'answers'
        });
    };

    Answer.associate = (models) => {
        Answer.belongsTo(Question, {
            foreignKey: 'questionId'
        });

        Answer.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'author'
        });
    };

    StudyGroup.associate = (models) => {
        StudyGroup.belongsToMany(models.User, {
            through: 'StudyGroupMembers',
            foreignKey: 'groupId',
            as: 'members'
        });
    };

    Mentor.associate = (models) => {
        Mentor.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return {
        Question,
        Answer,
        StudyGroup,
        Mentor
    };
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
            unique: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        field: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        career: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        introduction: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        education: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        skills: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        availableTime: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        profileImage: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        rating: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'suspended'),
            defaultValue: 'active'
        },
        verificationStatus: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending'
        }
    }, {
        tableName: 'mentors',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['field']
            },
            {
                fields: ['status']
            }
        ]
    });

    // MentorReview 모델 정의
    const MentorReview = sequelize.define('MentorReview', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        mentorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'mentors',
                key: 'id'
            }
        },
        reviewerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: 'mentor_reviews',
        timestamps: true
    });

    // MentorVerification 모델 정의
    const MentorVerification = sequelize.define('MentorVerification', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        mentorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'mentors',
                key: 'id'
            }
        },
        documentType: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        documentUrl: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        verifiedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'mentor_verifications',
        timestamps: true
    });

    // 모델 간 관계 설정
    Mentor.associate = (models) => {
        Mentor.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });

        Mentor.hasMany(MentorReview, {
            foreignKey: 'mentorId',
            as: 'reviews'
        });

        Mentor.hasMany(MentorVerification, {
            foreignKey: 'mentorId',
            as: 'verifications'
        });
    };

    MentorReview.associate = (models) => {
        MentorReview.belongsTo(Mentor, {
            foreignKey: 'mentorId'
        });

        MentorReview.belongsTo(models.User, {
            foreignKey: 'reviewerId',
            as: 'reviewer'
        });
    };

    MentorVerification.associate = (models) => {
        MentorVerification.belongsTo(Mentor, {
            foreignKey: 'mentorId'
        });

        MentorVerification.belongsTo(models.User, {
            foreignKey: 'verifiedBy',
            as: 'verifier'
        });
    };

    return {
        Mentor,
        MentorReview,
        MentorVerification
    };
};
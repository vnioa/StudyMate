const { DataTypes } = require('sequelize');

// 상수 정의
const MENTOR_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

const VERIFICATION_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
};

const DOCUMENT_TYPES = {
    CERTIFICATE: 'certificate',
    LICENSE: 'license',
    DEGREE: 'degree',
    OTHER: 'other'
};

module.exports = (sequelize) => {
    // Mentor 모델 정의
    const Mentor = sequelize.define('Mentor', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '멘토 ID'
        },
        memberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '회원번호'
        },
        field: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '전문 분야'
        },
        career: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            },
            comment: '경력 사항'
        },
        introduction: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [10, 2000]
            },
            comment: '자기 소개'
        },
        education: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '학력 사항'
        },
        skills: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '보유 기술'
        },
        availableTime: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                isValidTimeFormat(value) {
                    if (value && typeof value !== 'object') {
                        throw new Error('시간 형식이 올바르지 않습니다.');
                    }
                }
            },
            comment: '가능 시간대'
        },
        profileImage: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: '프로필 이미지 URL'
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
        },
        verificationStatus: {
            type: DataTypes.ENUM(Object.values(VERIFICATION_STATUS)),
            defaultValue: VERIFICATION_STATUS.PENDING,
            comment: '인증 상태'
        },
        hourlyRate: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            },
            comment: '시간당 수강료'
        },
        totalStudents: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            },
            comment: '총 학생 수'
        }
    }, {
        tableName: 'mentors',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['memberId'] },
            { fields: ['field'] },
            { fields: ['status', 'verificationStatus'] },
            { fields: ['rating'] }
        ],
        scopes: {
            active: {
                where: {
                    status: MENTOR_STATUS.ACTIVE,
                    verificationStatus: VERIFICATION_STATUS.VERIFIED
                }
            }
        }
    });

    // MentorReview 모델 정의
    const MentorReview = sequelize.define('MentorReview', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '리뷰 ID'
        },
        mentorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mentors',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '멘토 ID'
        },
        reviewerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'auth',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '리뷰어 회원번호'
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            },
            comment: '평점'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [10, 1000]
            },
            comment: '리뷰 내용'
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '검증 여부'
        }
    }, {
        tableName: 'mentor_reviews',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['mentorId'] },
            { fields: ['reviewerId'] },
            { fields: ['rating'] }
        ]
    });

    // MentorVerification 모델 정의
    const MentorVerification = sequelize.define('MentorVerification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '인증 ID'
        },
        mentorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mentors',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: '멘토 ID'
        },
        documentType: {
            type: DataTypes.ENUM(Object.values(DOCUMENT_TYPES)),
            allowNull: false,
            comment: '문서 유형'
        },
        documentUrl: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                isUrl: true
            },
            comment: '문서 URL'
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '인증 시간'
        },
        verifiedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'auth',
                key: 'id'
            },
            comment: '인증자 회원번호'
        },
        status: {
            type: DataTypes.ENUM(Object.values(VERIFICATION_STATUS)),
            defaultValue: VERIFICATION_STATUS.PENDING,
            comment: '인증 상태'
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '거절 사유'
        }
    }, {
        tableName: 'mentor_verifications',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['mentorId'] },
            { fields: ['status'] }
        ]
    });

    // 모델 간 관계 설정
    Mentor.associate = (models) => {
        Mentor.belongsTo(models.Auth, {
            foreignKey: 'memberId',
            as: 'member',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        Mentor.hasMany(MentorReview, {
            foreignKey: 'mentorId',
            as: 'reviews',
            onDelete: 'CASCADE'
        });

        Mentor.hasMany(MentorVerification, {
            foreignKey: 'mentorId',
            as: 'verifications',
            onDelete: 'CASCADE'
        });
    };

    MentorReview.associate = (models) => {
        MentorReview.belongsTo(Mentor, {
            foreignKey: 'mentorId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        MentorReview.belongsTo(models.Auth, {
            foreignKey: 'reviewerId',
            as: 'reviewer',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    };

    MentorVerification.associate = (models) => {
        MentorVerification.belongsTo(Mentor, {
            foreignKey: 'mentorId',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        MentorVerification.belongsTo(models.Auth, {
            foreignKey: 'verifiedBy',
            as: 'verifier',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    };

    return {
        Mentor,
        MentorReview,
        MentorVerification,
        MENTOR_STATUS,
        VERIFICATION_STATUS,
        DOCUMENT_TYPES
    };
};
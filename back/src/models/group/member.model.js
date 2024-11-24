const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'member', 'mentor', 'mentee'],
        default: 'member'
    },
    permissions: {
        canUpload: {
            type: Boolean,
            default: true
        },
        canCreateQuiz: {
            type: Boolean,
            default: false
        },
        canManageMembers: {
            type: Boolean,
            default: false
        }
    },
    mentoring: {
        isMentor: {
            type: Boolean,
            default: false
        },
        mentees: [{
            userId: String,
            startDate: Date,
            endDate: Date,
            status: {
                type: String,
                enum: ['active', 'completed', 'terminated'],
                default: 'active'
            }
        }],
        mentor: {
            userId: String,
            startDate: Date,
            endDate: Date,
            status: {
                type: String,
                enum: ['active', 'completed', 'terminated']
            }
        }
    },
    activity: {
        lastActive: {
            type: Date,
            default: Date.now
        },
        studyTime: {
            type: Number,
            default: 0
        },
        participationRate: {
            type: Number,
            default: 0
        },
        contributions: {
            materials: {
                type: Number,
                default: 0
            },
            quizzes: {
                type: Number,
                default: 0
            },
            discussions: {
                type: Number,
                default: 0
            }
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 인덱스 생성
memberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
memberSchema.index({ 'mentoring.mentor.userId': 1 });
memberSchema.index({ status: 1 });

// 업데이트 시 updatedAt 자동 갱신
memberSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 활동 시간 업데이트 메서드
memberSchema.methods.updateStudyTime = async function(minutes) {
    this.activity.studyTime += minutes;
    this.activity.lastActive = new Date();
    return await this.save();
};

// 멘토링 관계 설정 메서드
memberSchema.methods.setMentorRelation = async function(mentorId) {
    this.mentoring.mentor = {
        userId: mentorId,
        startDate: new Date(),
        status: 'active'
    };
    return await this.save();
};

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
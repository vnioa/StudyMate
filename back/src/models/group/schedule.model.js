const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        index: true
    },
    creatorId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['study', 'meeting', 'quiz', 'event'],
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    endTime: {
        type: Date,
        required: true
    },
    participants: [{
        userId: String,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        responseTime: Date
    }],
    location: {
        type: {
            type: String,
            enum: ['online', 'offline'],
            default: 'online'
        },
        detail: String,
        link: String
    },
    reminders: [{
        time: Date,
        type: {
            type: String,
            enum: ['email', 'push', 'both'],
            default: 'push'
        },
        sent: {
            type: Boolean,
            default: false
        }
    }],
    recurrence: {
        type: {
            type: String,
            enum: ['none', 'daily', 'weekly', 'monthly'],
            default: 'none'
        },
        interval: Number,
        endDate: Date
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 인덱스 생성
scheduleSchema.index({ groupId: 1, startTime: 1 });
scheduleSchema.index({ 'participants.userId': 1 });
scheduleSchema.index({ status: 1 });

// 업데이트 시 updatedAt 자동 갱신
scheduleSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 참가자 응답 업데이트 메서드
scheduleSchema.methods.updateParticipantStatus = async function(userId, status) {
    const participant = this.participants.find(p => p.userId === userId);
    if (participant) {
        participant.status = status;
        participant.responseTime = new Date();
    } else {
        this.participants.push({
            userId,
            status,
            responseTime: new Date()
        });
    }
    return await this.save();
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
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
    timeLimit: {
        type: Number,  // minutes
        default: 30
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['multiple_choice', 'true_false', 'short_answer'],
            required: true
        },
        options: [{
            text: String,
            isCorrect: Boolean
        }],
        correctAnswer: String,
        points: {
            type: Number,
            default: 1
        },
        explanation: String
    }],
    settings: {
        shuffleQuestions: {
            type: Boolean,
            default: false
        },
        showResults: {
            type: Boolean,
            default: true
        },
        attemptsAllowed: {
            type: Number,
            default: 1
        }
    },
    results: [{
        userId: String,
        score: Number,
        answers: [{
            questionId: String,
            answer: String,
            isCorrect: Boolean
        }],
        timeTaken: Number,
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }],
    analytics: {
        totalAttempts: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        },
        highestScore: {
            type: Number,
            default: 0
        },
        lowestScore: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'closed'],
        default: 'draft'
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
quizSchema.index({ groupId: 1, status: 1 });
quizSchema.index({ creatorId: 1 });
quizSchema.index({ 'results.userId': 1 });

// 업데이트 시 updatedAt 자동 갱신
quizSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// 퀴즈 결과 추가 메서드
quizSchema.methods.addResult = async function(result) {
    this.results.push(result);

    // 통계 업데이트
    this.analytics.totalAttempts += 1;

    const scores = this.results.map(r => r.score);
    this.analytics.averageScore = scores.reduce((a, b) => a + b) / scores.length;
    this.analytics.highestScore = Math.max(...scores);
    this.analytics.lowestScore = Math.min(...scores);

    return await this.save();
};

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
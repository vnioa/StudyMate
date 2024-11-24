class StudyFormatter {
    // 학습 시간 포맷팅 (분 단위를 시간:분 형태로 변환)
    formatStudyTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}시간 ${mins}분`;
    }

    // 날짜 포맷팅
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 진행률 포맷팅
    formatProgress(current, total) {
        const percentage = (current / total) * 100;
        return `${percentage.toFixed(1)}%`;
    }

    // 점수 포맷팅
    formatScore(score, totalScore) {
        return `${score}/${totalScore} (${(score/totalScore * 100).toFixed(1)}%)`;
    }

    // 학습 통계 포맷팅
    formatStudyStats(stats) {
        return {
            totalSessions: stats.totalSessions,
            totalTime: this.formatStudyTime(stats.totalMinutes),
            averageTime: this.formatStudyTime(stats.averageMinutes),
            completedGoals: stats.completedGoals
        };
    }

    // 퀴즈 결과 포맷팅
    formatQuizResult(result) {
        return {
            score: this.formatScore(result.score, result.totalQuestions),
            timeSpent: this.formatStudyTime(result.timeSpent),
            completedAt: this.formatDate(result.completedAt)
        };
    }

    // 학습 세션 요약 포맷팅
    formatSessionSummary(session) {
        return {
            subject: session.subject,
            duration: this.formatStudyTime(session.duration),
            startTime: this.formatDate(session.startTime),
            endTime: this.formatDate(session.endTime),
            progress: this.formatProgress(session.completed, session.total)
        };
    }
}

module.exports = new StudyFormatter();
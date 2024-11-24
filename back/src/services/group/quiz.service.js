const db = require('../config/mysql');

class QuizService {
    // 퀴즈 생성
    async createQuiz(groupId, creatorId, quizData) {
        try {
            const { title, description, questions, timeLimit } = quizData;

            await db.beginTransaction();
            try {
                // 퀴즈 기본 정보 저장
                const [quiz] = await db.execute(
                    'INSERT INTO group_quizzes (group_id, creator_id, title, description, time_limit) VALUES (?, ?, ?, ?, ?)',
                    [groupId, creatorId, title, description, timeLimit]
                );

                // 퀴즈 문제 저장
                for (const question of questions) {
                    await db.execute(
                        'INSERT INTO quiz_questions (quiz_id, question, type, options, correct_answer, points) VALUES (?, ?, ?, ?, ?, ?)',
                        [quiz.insertId, question.question, question.type, JSON.stringify(question.options), question.correctAnswer, question.points]
                    );
                }

                await db.commit();
                return quiz.insertId;
            } catch (error) {
                await db.rollback();
                throw error;
            }
        } catch (error) {
            console.error('퀴즈 생성 오류:', error);
            throw new Error('퀴즈 생성에 실패했습니다.');
        }
    }

    // 퀴즈 제출 및 채점
    async submitQuiz(quizId, userId, answers) {
        try {
            // 문제 정답 조회
            const [questions] = await db.execute(
                'SELECT id, correct_answer, points FROM quiz_questions WHERE quiz_id = ?',
                [quizId]
            );

            // 점수 계산
            let totalScore = 0;
            const results = [];

            for (const question of questions) {
                const userAnswer = answers.find(a => a.questionId === question.id);
                const isCorrect = userAnswer?.answer === question.correct_answer;
                totalScore += isCorrect ? question.points : 0;

                results.push({
                    questionId: question.id,
                    correct: isCorrect,
                    userAnswer: userAnswer?.answer,
                    correctAnswer: question.correct_answer
                });
            }

            // 결과 저장
            await db.execute(
                'INSERT INTO quiz_results (quiz_id, user_id, score, answers) VALUES (?, ?, ?, ?)',
                [quizId, userId, totalScore, JSON.stringify(results)]
            );

            return { score: totalScore, results };
        } catch (error) {
            console.error('퀴즈 제출 오류:', error);
            throw new Error('퀴즈 제출에 실패했습니다.');
        }
    }

    // 퀴즈 결과 분석
    async analyzeQuizResults(quizId) {
        try {
            // 전체 결과 통계
            const [stats] = await db.execute(
                `SELECT
                     COUNT(*) as attempt_count,
                     AVG(score) as average_score,
                     MAX(score) as highest_score,
                     MIN(score) as lowest_score
                 FROM quiz_results
                 WHERE quiz_id = ?`,
                [quizId]
            );

            // 문제별 정답률
            const [questionStats] = await db.execute(
                `SELECT
                     q.id,
                     q.question,
                     COUNT(CASE WHEN r.answers LIKE CONCAT('%"correct":true%') THEN 1 END) as correct_count,
                     COUNT(*) as total_attempts
                 FROM quiz_questions q
                          LEFT JOIN quiz_results r ON r.quiz_id = q.quiz_id
                 WHERE q.quiz_id = ?
                 GROUP BY q.id`,
                [quizId]
            );

            return {
                stats: stats[0],
                questionStats
            };
        } catch (error) {
            console.error('퀴즈 분석 오류:', error);
            throw new Error('퀴즈 분석에 실패했습니다.');
        }
    }
}

module.exports = new QuizService();
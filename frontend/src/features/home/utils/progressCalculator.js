// features/home/utils/progressCalculator.js

/**
 * 학습 진행도 계산 및 관리를 위한 유틸리티 함수들
 */

/**
 * 전체 학습 진행도 계산
 * @param {Object} goals - 목표 데이터 객체
 * @returns {number} 전체 진행도 (0-100)
 */
export const calculateTotalProgress = (goals) => {
    if (!goals || goals.length === 0) return 0;

    const totalWeight = goals.reduce((sum, goal) => sum + (goal.weight || 1), 0);
    const weightedProgress = goals.reduce((sum, goal) => {
        return sum + ((goal.progress || 0) * (goal.weight || 1));
    }, 0);

    return Math.round((weightedProgress / totalWeight) * 100) / 100;
};

/**
 * 일일 학습 진행도 계산
 * @param {Object} dailyGoals - 일일 목표 데이터
 * @param {number} targetHours - 목표 학습 시간
 * @returns {number} 일일 진행도 (0-100)
 */
export const calculateDailyProgress = (dailyGoals, targetHours) => {
    if (!dailyGoals || dailyGoals.length === 0) return 0;

    const completedMinutes = dailyGoals.reduce((sum, goal) => {
        return sum + (goal.completedMinutes || 0);
    }, 0);

    const targetMinutes = targetHours * 60;
    return Math.min(Math.round((completedMinutes / targetMinutes) * 100), 100);
};

/**
 * 주간 학습 진행도 계산
 * @param {Array} weeklyData - 주간 학습 데이터 배열
 * @returns {number} 주간 진행도 (0-100)
 */
export const calculateWeeklyProgress = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return 0;

    const totalDays = 7;
    const completedDays = weeklyData.filter(day => day.isCompleted).length;
    return Math.round((completedDays / totalDays) * 100);
};

/**
 * 월간 학습 진행도 계산
 * @param {Array} monthlyData - 월간 학습 데이터 배열
 * @returns {number} 월간 진행도 (0-100)
 */
export const calculateMonthlyProgress = (monthlyData) => {
    if (!monthlyData || monthlyData.length === 0) return 0;

    const totalGoals = monthlyData.length;
    const completedGoals = monthlyData.filter(goal => goal.isCompleted).length;
    return Math.round((completedGoals / totalGoals) * 100);
};

/**
 * 목표별 가중치 진행도 계산
 * @param {Object} goal - 목표 객체
 * @returns {number} 가중치가 적용된 진행도
 */
export const calculateWeightedProgress = (goal) => {
    if (!goal) return 0;

    const baseProgress = goal.progress || 0;
    const weight = goal.weight || 1;
    return baseProgress * weight;
};

/**
 * 학습 시간 기반 진행도 계산
 * @param {number} studiedMinutes - 학습한 시간(분)
 * @param {number} targetMinutes - 목표 시간(분)
 * @returns {number} 시간 기반 진행도 (0-100)
 */
export const calculateTimeBasedProgress = (studiedMinutes, targetMinutes) => {
    if (!studiedMinutes || !targetMinutes) return 0;
    return Math.min(Math.round((studiedMinutes / targetMinutes) * 100), 100);
};

/**
 * 목표 달성 예상 시간 계산
 * @param {number} currentProgress - 현재 진행도
 * @param {number} averageProgressPerDay - 일평균 진행도
 * @returns {number} 목표 달성까지 예상 소요 일수
 */
export const calculateEstimatedCompletion = (currentProgress, averageProgressPerDay) => {
    if (!currentProgress || !averageProgressPerDay) return 0;

    const remainingProgress = 100 - currentProgress;
    return Math.ceil(remainingProgress / averageProgressPerDay);
};

/**
 * 진행도 상태 평가
 * @param {number} progress - 현재 진행도
 * @param {number} expectedProgress - 예상 진행도
 * @returns {string} 진행 상태 ('ahead', 'onTrack', 'behind')
 */
export const evaluateProgressStatus = (progress, expectedProgress) => {
    if (progress >= expectedProgress + 10) return 'ahead';
    if (progress <= expectedProgress - 10) return 'behind';
    return 'onTrack';
};

/**
 * 목표 달성률 계산
 * @param {Array} completedGoals - 완료된 목표 배열
 * @param {Array} totalGoals - 전체 목표 배열
 * @returns {number} 목표 달성률 (0-100)
 */
export const calculateGoalCompletionRate = (completedGoals, totalGoals) => {
    if (!completedGoals || !totalGoals || totalGoals.length === 0) return 0;
    return Math.round((completedGoals.length / totalGoals.length) * 100);
};

/**
 * 학습 효율성 점수 계산
 * @param {number} progress - 진행도
 * @param {number} timeSpent - 소요 시간(분)
 * @param {number} expectedTime - 예상 소요 시간(분)
 * @returns {number} 효율성 점수 (0-100)
 */
export const calculateEfficiencyScore = (progress, timeSpent, expectedTime) => {
    if (!progress || !timeSpent || !expectedTime) return 0;

    const timeEfficiency = expectedTime / timeSpent;
    const progressWeight = progress / 100;
    return Math.round(timeEfficiency * progressWeight * 100);
};

export default {
    calculateTotalProgress,
    calculateDailyProgress,
    calculateWeeklyProgress,
    calculateMonthlyProgress,
    calculateWeightedProgress,
    calculateTimeBasedProgress,
    calculateEstimatedCompletion,
    evaluateProgressStatus,
    calculateGoalCompletionRate,
    calculateEfficiencyScore
};
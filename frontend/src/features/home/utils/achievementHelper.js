// features/home/utils/achievementHelper.js

/**
 * 성취 및 배지 관리를 위한 유틸리티 함수들
 */

/**
 * 배지 획득 조건 체크
 * @param {Object} userStats - 사용자 통계 데이터
 * @param {Object} badgeCriteria - 배지 획득 기준
 * @returns {boolean} 배지 획득 가능 여부
 */
export const checkBadgeEligibility = (userStats, badgeCriteria) => {
    if (!userStats || !badgeCriteria) return false;

    const {
        studyTime,
        completedGoals,
        streak,
        averageScore
    } = userStats;

    const {
        requiredStudyTime,
        requiredGoals,
        requiredStreak,
        requiredScore
    } = badgeCriteria;

    return (
        studyTime >= (requiredStudyTime || 0) &&
        completedGoals >= (requiredGoals || 0) &&
        streak >= (requiredStreak || 0) &&
        averageScore >= (requiredScore || 0)
    );
};

/**
 * 성취도 점수 계산
 * @param {Object} achievements - 사용자 성취 데이터
 * @returns {number} 성취도 점수 (0-100)
 */
export const calculateAchievementScore = (achievements) => {
    if (!achievements) return 0;

    const {
        completedGoals,
        totalGoals,
        studyTime,
        targetStudyTime,
        earnedBadges,
        totalBadges
    } = achievements;

    const goalScore = (completedGoals / totalGoals) * 40;
    const timeScore = (studyTime / targetStudyTime) * 30;
    const badgeScore = (earnedBadges / totalBadges) * 30;

    return Math.min(Math.round(goalScore + timeScore + badgeScore), 100);
};

/**
 * 레벨 계산
 * @param {number} experiencePoints - 경험치
 * @returns {Object} 현재 레벨 및 다음 레벨까지 필요한 경험치
 */
export const calculateLevel = (experiencePoints) => {
    if (!experiencePoints) return { level: 1, nextLevelExp: 100, progress: 0 };

    const baseExp = 100;
    const levelFactor = 1.5;
    let level = 1;
    let accumulatedExp = 0;
    let nextLevelExp = baseExp;

    while (accumulatedExp + nextLevelExp <= experiencePoints) {
        accumulatedExp += nextLevelExp;
        level += 1;
        nextLevelExp = Math.round(baseExp * Math.pow(levelFactor, level - 1));
    }

    const currentLevelExp = experiencePoints - accumulatedExp;
    const progress = Math.round((currentLevelExp / nextLevelExp) * 100);

    return { level, nextLevelExp, progress };
};

/**
 * 성취 배지 색상 결정
 * @param {string} achievementType - 성취 유형
 * @param {number} value - 성취 값
 * @returns {string} 배지 색상 코드
 */
export const getBadgeColor = (achievementType, value) => {
    const colors = {
        study: {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            platinum: '#E5E4E2'
        },
        goals: {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            platinum: '#E5E4E2'
        },
        streak: {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700',
            platinum: '#E5E4E2'
        }
    };

    const thresholds = {
        study: { bronze: 10, silver: 50, gold: 100, platinum: 200 },
        goals: { bronze: 5, silver: 20, gold: 50, platinum: 100 },
        streak: { bronze: 7, silver: 30, gold: 90, platinum: 180 }
    };

    const type = colors[achievementType] || colors.study;
    const threshold = thresholds[achievementType] || thresholds.study;

    if (value >= threshold.platinum) return type.platinum;
    if (value >= threshold.gold) return type.gold;
    if (value >= threshold.silver) return type.silver;
    return type.bronze;
};

/**
 * 성취 메시지 생성
 * @param {Object} achievement - 성취 데이터
 * @returns {string} 성취 메시지
 */
export const generateAchievementMessage = (achievement) => {
    const messages = {
        study: {
            bronze: '학습을 시작했네요! 앞으로도 힘내세요.',
            silver: '꾸준한 학습이 이어지고 있어요!',
            gold: '대단한 학습 의지를 보여주고 계시네요!',
            platinum: '최고의 학습왕이 되셨어요!'
        },
        goals: {
            bronze: '첫 목표 달성을 축하드려요!',
            silver: '목표 달성의 달인이 되어가고 있어요!',
            gold: '놀라운 목표 달성률이에요!',
            platinum: '목표 달성의 전설이 되셨어요!'
        },
        streak: {
            bronze: '학습 습관이 만들어지고 있어요!',
            silver: '대단한 학습 연속 기록이에요!',
            gold: '정말 대단한 의지력이에요!',
            platinum: '최장 연속 학습 기록을 세우셨어요!'
        }
    };

    const { type, value } = achievement;
    const thresholds = {
        study: { bronze: 10, silver: 50, gold: 100, platinum: 200 },
        goals: { bronze: 5, silver: 20, gold: 50, platinum: 100 },
        streak: { bronze: 7, silver: 30, gold: 90, platinum: 180 }
    };

    const typeMessages = messages[type] || messages.study;
    const threshold = thresholds[type] || thresholds.study;

    if (value >= threshold.platinum) return typeMessages.platinum;
    if (value >= threshold.gold) return typeMessages.gold;
    if (value >= threshold.silver) return typeMessages.silver;
    return typeMessages.bronze;
};

export default {
    checkBadgeEligibility,
    calculateAchievementScore,
    calculateLevel,
    getBadgeColor,
    generateAchievementMessage
};
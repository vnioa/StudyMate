// utils/aiUtils.js
exports.analyzeRelationships = async (interactions) => {
    // 여기에 실제 AI 모델을 사용한 관계 분석 로직을 구현합니다.
    // 이 예시에서는 간단한 로직으로 대체합니다.
    return interactions.map(interaction => ({
        userId: interaction.user_id,
        friendId: interaction.friend_id,
        strength: Math.random() // 0-1 사이의 랜덤 값으로 관계 강도 표현
    }));
};

exports.generateFriendRecommendations = async (user, friendsOfFriends) => {
    // 여기에 실제 AI 모델을 사용한 친구 추천 로직을 구현합니다.
    // 이 예시에서는 간단한 로직으로 대체합니다.
    return friendsOfFriends
        .map(friend => ({
            ...friend,
            score: Math.random() // 0-1 사이의 랜덤 값으로 추천 점수 표현
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // 상위 5명만 추천
};
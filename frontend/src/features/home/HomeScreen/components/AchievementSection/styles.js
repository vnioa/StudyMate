// features/home/components/AchievementSection/styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    // 섹션 컨테이너
    container: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // 헤더 스타일
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    viewAll: {
        fontSize: 14,
        color: '#007AFF',
    },

    // 배지 섹션
    badgeSection: {
        marginBottom: 24,
    },
    badgeScrollView: {
        marginTop: 12,
    },
    badgeContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 100,
    },
    badgeImage: {
        width: 60,
        height: 60,
        marginBottom: 8,
    },
    badgeTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
        textAlign: 'center',
    },
    badgeDate: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },

    // 진행도 차트 섹션
    chartSection: {
        marginBottom: 24,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    progressChart: {
        width: 120,
        height: 120,
    },
    statsContainer: {
        flex: 1,
        marginLeft: 20,
    },
    statItem: {
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
    },

    // 통계 대시보드 섹션
    dashboardSection: {
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    statBox: {
        width: (width - 88) / 2,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statBoxValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statBoxLabel: {
        fontSize: 14,
        color: '#666666',
    },

    // 애니메이션 관련 스타일
    fadeIn: {
        opacity: 1,
        transform: [{ scale: 1 }],
    },
    fadeOut: {
        opacity: 0,
        transform: [{ scale: 0.9 }],
    },

    // 반응형 스타일
    '@media (min-width: 768px)': {
        container: {
            marginHorizontal: 24,
        },
        statBox: {
            width: (width - 112) / 4,
        },
    },

    // 상호작용 스타일
    pressable: {
        opacity: 1,
    },
    pressableActive: {
        opacity: 0.7,
    },

    // 로딩 및 에러 상태
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        padding: 20,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#DC2626',
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
});
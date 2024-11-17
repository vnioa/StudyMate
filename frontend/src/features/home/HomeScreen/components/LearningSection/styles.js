// features/home/components/LearningSection/styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    // 메인 컨테이너
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

    // 공통 헤더
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

    // 맞춤 콘텐츠 섹션
    personalizedSection: {
        marginBottom: 24,
    },
    scrollContent: {
        paddingRight: 20,
    },
    contentCard: {
        width: width * 0.7,
        marginRight: 16,
    },

    // 인기 콘텐츠 섹션
    popularSection: {
        marginBottom: 20,
    },
    popularItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
    },
    rankingBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankingText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    trendingIcon: {
        position: 'absolute',
        top: 12,
        right: 12,
    },

    // 콘텐츠 카드 스타일
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    metaText: {
        fontSize: 12,
        color: '#666666',
        marginLeft: 4,
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

    // 반응형 스타일
    '@media (min-width: 768px)': {
        contentCard: {
            width: width * 0.4,
        },
    }
});
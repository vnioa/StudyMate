// features/home/components/GoalSection/styles.js
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

    // 섹션 헤더
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
    addButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },

    // 목표 리스트
    listContainer: {
        paddingBottom: 8,
    },
    goalItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 8,
    },
    deadline: {
        fontSize: 12,
        color: '#666666',
    },
    goalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    progressText: {
        fontSize: 12,
        color: '#666666',
    },

    // AI 피드백 섹션
    feedbackContainer: {
        marginTop: 20,
        marginBottom: 16,
    },
    feedbackCard: {
        backgroundColor: '#F0F7FF',
        borderRadius: 12,
        padding: 16,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    aiIcon: {
        marginRight: 8,
    },
    feedbackTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    feedbackText: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 20,
        marginBottom: 12,
    },
    actionButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },

    // 리마인더 섹션
    reminderContainer: {
        marginTop: 20,
    },
    reminderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    reminderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reminderTexts: {
        marginLeft: 12,
    },
    reminderTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    reminderTime: {
        fontSize: 12,
        color: '#666666',
    },

    // 우선순위 태그
    priorityTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
    },
    priorityHigh: {
        backgroundColor: '#FFE5E5',
        color: '#DC2626',
    },
    priorityMedium: {
        backgroundColor: '#FFF4E5',
        color: '#D97706',
    },
    priorityLow: {
        backgroundColor: '#E5F6FF',
        color: '#0284C7',
    },

    // 빈 상태
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666666',
        fontSize: 14,
        marginTop: 8,
    },
    emptyButton: {
        marginTop: 16,
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },

    // 로딩 상태
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // 에러 상태
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
        container: {
            marginHorizontal: 24,
        },
        goalItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
    }
});
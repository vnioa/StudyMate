// features/home/components/StudyGroupSection/styles.js
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

    // 공통 헤더 스타일
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

    // 그룹 요약 섹션
    summarySection: {
        marginBottom: 24,
    },
    scrollContent: {
        paddingRight: 20,
    },
    groupCard: {
        width: width * 0.7,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    groupDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 12,
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
        textAlign: 'right',
    },
    groupInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberCount: {
        fontSize: 12,
        color: '#666666',
    },
    nextMeeting: {
        fontSize: 12,
        color: '#007AFF',
    },

    // 커뮤니티 피드 섹션
    feedSection: {
        marginBottom: 24,
    },
    feedContent: {
        paddingBottom: 8,
    },
    postItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    postTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 8,
    },
    postTime: {
        fontSize: 12,
        color: '#666666',
    },
    postContent: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 20,
        marginBottom: 12,
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    postStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        color: '#666666',
        marginLeft: 4,
        marginRight: 12,
    },

    // 알림 센터 섹션
    notificationSection: {
        marginBottom: 20,
    },
    notificationList: {  // notificationContent를 notificationList로 변경
        paddingBottom: 8,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    unreadNotification: {
        backgroundColor: '#F0F7FF',
    },
    notificationContentWrapper: {  // notificationContent를 더 명확한 이름으로 변경
        flex: 1,
        marginLeft: 12,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 13,
        color: '#666666',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999999',
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
        groupCard: {
            width: width * 0.4,
        },
        container: {
            marginHorizontal: 24,
        },
    }
});
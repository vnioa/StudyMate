// features/social/screens/chat/ChatSettingsScreen/styles.js
import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    // 메인 컨테이너
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    content: {
        flex: 1,
    },

    // 헤더 스타일
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
        textAlign: 'center',
    },

    // 채팅방 정보 스타일
    infoContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 8,
    },
    thumbnailContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E5E5EA',
    },
    editOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        marginTop: 16,
    },
    titleInput: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        padding: 8,
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        marginBottom: 8,
    },
    descriptionInput: {
        fontSize: 15,
        color: '#000000',
        padding: 8,
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: '#666666',
        marginBottom: 16,
    },
    lastUpdated: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 8,
    },
    saveButton: {
        backgroundColor: '#0057D9',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    // 통계 정보 스타일
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        marginTop: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#8E8E93',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E5EA',
    },

    // 참가자 목록 스타일
    participantListContainer: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    participantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    participantTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    participantActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    participantAction: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
    },
    participantActionText: {
        fontSize: 15,
        color: '#0057D9',
        marginLeft: 4,
    },
    removeAction: {
        marginLeft: 16,
    },
    removeText: {
        color: '#FF3B30',
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#FFFFFF',
    },
    participantItemSelected: {
        backgroundColor: '#F5F7FA',
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    participantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    participantDetails: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 2,
    },
    participantJoinDate: {
        fontSize: 13,
        color: '#8E8E93',
    },
    onlineIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#34C759',
        marginRight: 8,
    },
    participantSeparator: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 64,
    },

    // 알림 설정 스타일
    settingsSection: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#8E8E93',
        padding: 16,
        paddingBottom: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        color: '#000000',
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 13,
        color: '#8E8E93',
    },

    // 액션 버튼 스타일
    actionContainer: {
        backgroundColor: '#FFFFFF',
        marginTop: 20,
        borderRadius: 10,
        overflow: 'hidden',
    },
    actionSectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#8E8E93',
        padding: 16,
        paddingBottom: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    actionText: {
        fontSize: 16,
        marginLeft: 12,
    },
    destructiveText: {
        color: '#FF3B30',
    }
});
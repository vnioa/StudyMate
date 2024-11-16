// features/social/screens/friend/FriendManageScreen/styles.js
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
    headerButtonMargin: {
        marginRight: 16,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButtonText: {
        fontSize: 16,
        color: '#0057D9',
    },
    headerButtonTextActive: {
        color: '#FF3B30',
    },

    // 차단된 사용자 목록 스타일
    listContent: {
        paddingHorizontal: 16,
    },
    emptyListContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    listHeaderText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#8E8E93',
    },
    selectedCount: {
        fontSize: 15,
        color: '#0057D9',
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 60,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
    },
    loadingContainer: {
        padding: 20,
    },

    // 차단된 사용자 아이템 스타일
    blockedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    blockedItemSelected: {
        backgroundColor: '#F5F7FA',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkBox: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E5E5EA',
    },
    userDetails: {
        flex: 1,
        marginLeft: 12,
    },
    nameContainer: {
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    userEmail: {
        fontSize: 14,
        color: '#8E8E93',
    },
    infoContainer: {
        flexDirection: 'column',
    },
    blockedDate: {
        fontSize: 13,
        color: '#8E8E93',
    },
    mutualFriends: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    blockReason: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    unblockButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#0057D9',
    },
    unblockText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },

    // 액션 버튼 스타일
    actionsContainer: {
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    actionsContainerIOS: {
        marginBottom: -20,
    },
    actionsContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#0057D9',
    },
    removeButton: {
        backgroundColor: '#FF3B30',
    },
    actionIcon: {
        marginRight: 8,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    actionsShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        opacity: 0.9,
    },

    // 다이얼로그 스타일
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogOverlayAndroid: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    dialogContainer: {
        width: width - 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
    },
    dialogContainerIOS: {
        maxWidth: 340,
    },
    dialogContainerAndroid: {
        maxWidth: 320,
    },
    dialogHeader: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dialogHeaderIOS: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    dialogTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    dialogTitleIOS: {
        textAlign: 'center',
        flex: 1,
    },
    dialogTitleAndroid: {
        fontSize: 20,
    },
    dialogCloseButton: {
        padding: 4,
    },
    dialogContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    dialogContentIOS: {
        paddingTop: 12,
    },
    dialogContentAndroid: {
        paddingTop: 8,
        paddingBottom: 20,
    },
    dialogMessage: {
        fontSize: 15,
        color: '#000000',
        textAlign: 'center',
    },
    dialogMessageIOS: {
        textAlign: 'center',
    },
    dialogMessageAndroid: {
        textAlign: 'left',
    },
    dialogActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    dialogActionsIOS: {
        justifyContent: 'space-between',
    },
    dialogActionsAndroid: {
        justifyContent: 'flex-end',
        padding: 8,
    },
    dialogButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogButtonIOS: {
        borderRightWidth: 1,
        borderRightColor: '#E5E5EA',
    },
    dialogCancelButton: {
        backgroundColor: '#F5F7FA',
    },
    dialogConfirmButton: {
        backgroundColor: '#0057D9',
    },
    dialogDestructiveButton: {
        backgroundColor: '#FF3B30',
    },
    dialogCancelText: {
        fontSize: 17,
        color: '#8E8E93',
    },
    dialogConfirmText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    dialogDestructiveText: {
        color: '#FFFFFF',
    },
    dialogButtonTextIOS: {
        fontSize: 17,
    }
});
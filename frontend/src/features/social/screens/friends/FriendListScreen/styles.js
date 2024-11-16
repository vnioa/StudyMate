// features/social/screens/friend/FriendListScreen/styles.js
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
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
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#000000',
    },
    headerCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    headerCount: {
        fontSize: 13,
        color: '#8E8E93',
    },
    headerOnlineCount: {
        fontSize: 13,
        color: '#34C759',
        marginLeft: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        marginLeft: 8,
    },
    headerButtonLast: {
        marginLeft: 16,
    },

    // 검색 스타일
    searchContainer: {
        padding: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 36,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#000000',
        padding: 0,
        ...Platform.select({
            android: {
                paddingVertical: 6,
            },
        }),
    },
    clearButton: {
        padding: 4,
    },

    // 친구 목록 스타일
    listContent: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        paddingVertical: 8,
        backgroundColor: '#F5F7FA',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
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

    // 친구 아이템 스타일
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    friendInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 12,
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E5E5EA',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    friendDetails: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 2,
    },
    statusMessage: {
        fontSize: 14,
        color: '#8E8E93',
    },
    lastActive: {
        fontSize: 12,
        color: '#8E8E93',
    },
    mutualFriends: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },
    chatButton: {
        padding: 8,
        marginLeft: 8,
    },

    // 친구 추가 버튼 스타일
    addButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'transparent',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0057D9',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    addButtonIcon: {
        marginRight: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    addButtonShadow: {
        position: 'absolute',
        bottom: 0,
        left: 16,
        right: 16,
        height: 40,
        backgroundColor: '#FFFFFF',
        opacity: 0.9,
    }
});
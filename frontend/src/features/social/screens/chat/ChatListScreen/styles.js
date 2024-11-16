// features/social/screens/chat/ChatListScreen/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    // 메인 컨테이너 스타일
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    listContainer: {
        paddingVertical: 8,
    },

    // ChatFilter 컴포넌트 스타일
    filterWrapper: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 1,
    },
    filterContainer: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    filterButtonActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#0057D9',
    },
    filterText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#0057D9',
        fontWeight: '600',
    },

    // ChatRoomItem 컴포넌트 스타일
    roomItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    roomInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        color: '#8E8E93',
        marginLeft: 8,
    },
    roomFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666666',
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadCount: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    participantsCount: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    participantsText: {
        fontSize: 12,
        color: '#666666',
        marginLeft: 4,
    },

    // 상태 표시 스타일
    onlineStatus: {
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
    typingIndicator: {
        fontSize: 14,
        color: '#007AFF',
        fontStyle: 'italic',
    },

    // 공통 스타일
    separator: {
        height: 1,
        backgroundColor: '#E5E5EA',
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
        marginTop: 8,
    },
    // 아바타 관련 스타일
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    pinnedIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },

    // 터치 피드백 스타일
    roomItemPressed: {
        opacity: 0.7,
        backgroundColor: '#F5F5F5',
    },

    // 그룹 참가자 수 스타일
    participantCount: {
        fontSize: 12,
        color: '#666666',
        marginLeft: 4,
        fontWeight: '500',
    },

    // 고정된 채팅방 스타일
    pinnedRoom: {
        backgroundColor: '#F8F9FE',
        borderLeftWidth: 3,
        borderLeftColor: '#0057D9',
    },

    // 음소거된 채팅방 스타일
    mutedRoom: {
        opacity: 0.8,
        backgroundColor: '#FAFAFA',
    },

    // 음소거된 텍스트 스타일
    mutedText: {
        color: '#8E8E93',
    },

    // 음소거 아이콘 스타일
    muteIcon: {
        marginLeft: 8,
        marginRight: 4,
    },
    filterBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },

    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },

    // 다크모드 스타일
    '@media (prefers-color-scheme: dark)': {
        container: {
            backgroundColor: '#000000',
        },
        roomItem: {
            backgroundColor: '#1C1C1E',
            borderBottomColor: '#38383A',
        },
        roomTitle: {
            color: '#FFFFFF',
        },
        lastMessage: {
            color: '#8E8E93',
        },
        filterWrapper: {
            backgroundColor: '#1C1C1E',
            borderBottomColor: '#38383A',
        },
        filterButton: {
            backgroundColor: '#2C2C2E',
            borderColor: '#38383A',
        },
        filterButtonActive: {
            backgroundColor: '#0A84FF20',
            borderColor: '#0A84FF',
        },
        filterText: {
            color: '#8E8E93',
        },
        filterTextActive: {
            color: '#0A84FF',
        },
        typingText: {
            fontSize: 14,
            color: '#007AFF',
            fontStyle: 'italic',
            flex: 1,
        },
        typingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        typingDot: {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#007AFF',
            marginRight: 2,
        },
        roomItemPressed: {
            backgroundColor: '#2C2C2E',
        },
        onlineIndicator: {
            borderColor: '#1C1C1E',
        },
        pinnedIndicator: {
            backgroundColor: '#0A84FF',
            borderColor: '#1C1C1E',
        },
        participantCount: {
            color: '#8E8E93',
        },
        pinnedRoom: {
            backgroundColor: '#1C1C1E',
            borderLeftColor: '#0A84FF',
        },
        mutedRoom: {
            backgroundColor: '#1C1C1E',
            opacity: 0.7,
        },
        mutedText: {
            color: '#636366',
        },

    },

    // 반응형 스타일
    '@media (min-width: 768px)': {
        container: {
            maxWidth: 800,
            alignSelf: 'center',
        },
        roomItem: {
            paddingVertical: 20,
        },
        avatar: {
            width: 60,
            height: 60,
            borderRadius: 30,
        },
        roomTitle: {
            fontSize: 18,
        },
        lastMessage: {
            fontSize: 15,
        },
        onlineIndicator: {
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 2.5,
        },
        pinnedIndicator: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2.5,
        },
        participantCount: {
            fontSize: 13,
        },
        pinnedRoom: {
            borderLeftWidth: 4,
        },
    }
});
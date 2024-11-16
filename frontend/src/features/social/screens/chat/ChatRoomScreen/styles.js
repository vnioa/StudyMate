// features/social/screens/chat/ChatRoomScreen/styles.js
import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

export default StyleSheet.create({
    // 메인 컨테이너
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        ...Platform.select({
            ios: {
                paddingTop: 44,
            },
            android: {
                paddingTop: 16,
                elevation: 4,
            },
        }),
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E5EA',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    subtitle: {
        fontSize: 13,
        color: '#8E8E93',
        marginTop: 2,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },

    // 메시지 리스트 스타일
    messageList: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    messageSeparator: {
        height: 8,
    },
    loadingMore: {
        padding: 16,
        alignItems: 'center',
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateSeparatorText: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },

    // 메시지 아이템 스타일
    messageContainer: {
        flexDirection: 'row',
        marginVertical: 4,
        maxWidth: width * 0.75,
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
    },
    messageContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 12,
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
    myMessageContent: {
        backgroundColor: '#0057D9',
        marginLeft: 8,
    },
    otherMessageContent: {
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    otherMessageText: {
        color: '#000000',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    myMessageFooter: {
        justifyContent: 'flex-end',
    },
    otherMessageFooter: {
        justifyContent: 'flex-start',
    },
    messageTime: {
        fontSize: 12,
        color: '#8E8E93',
        marginHorizontal: 4,
    },
    messageStatus: {
        fontSize: 12,
        color: '#8E8E93',
    },

    // 입력 컨테이너 스타일
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        ...Platform.select({
            ios: {
                paddingBottom: isIOS ? 34 : 8,
            },
        }),
    },
    inputActionsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        marginHorizontal: 8,
        padding: 8,
        maxHeight: 100,
        borderRadius: 20,
        backgroundColor: '#F5F7FA',
        fontSize: 16,
        color: '#000000',
    },
    inputActionsRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sendButton: {
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },

    // 파일 메시지 스타일
    fileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
    },
    fileInfo: {
        marginLeft: 8,
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    fileSize: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 2,
    },

    // 시스템 메시지 스타일
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    systemMessageText: {
        fontSize: 12,
        color: '#8E8E93',
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },

    // 옵션 모달 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    optionsContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        ...Platform.select({
            ios: {
                paddingBottom: 34,
            },
        }),
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    optionText: {
        fontSize: 16,
        marginLeft: 12,
        color: '#000000',
    },
    destructiveOption: {
        borderBottomWidth: 0,
    },
    destructiveText: {
        color: '#FF3B30',
    }
});
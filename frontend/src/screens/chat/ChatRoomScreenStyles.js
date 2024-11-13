// screens/ChatRoomScreenStyles.js

import { StyleSheet } from 'react-native';

const ChatRoomScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    onlineStatus: {
        marginBottom: 10,
        padding: 5,
        borderRadius: 10,
        backgroundColor: '#d4edda',
        alignItems: 'center',
    },
    onlineStatusText: {
        color: '#155724',
        fontSize: 14,
    },
    messageContainer: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderColor: '#e1e1e1',
        borderWidth: 1,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        color: "#888",
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        padding: 10,
        backgroundColor: '#fff',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#fff',
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    replyContainer: {
        backgroundColor: '#e9ecef',
        padding: 8,
        borderRadius: 10,
        marginBottom: 5,
    },
    replyText: {
        fontSize: 14,
        color: '#495057',
    },
    cancelReplyButton: {
        alignSelf: 'flex-end',
        marginTop: 5,
    },
    scheduledMessageContainer: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 10,
        backgroundColor: '#fff3cd',
        borderColor: '#ffeeba',
        borderWidth: 1,
    },
    scheduledMessageText: {
        fontSize: 14,
        color: '#856404',
    },
    fileUploadContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#e2e3e5',
        borderRadius: 10,
        alignItems: 'center',
    },
    fileUploadText: {
        color: '#343a40',
        fontSize: 14,
    },
    flatListContainer: {
        flex: 1,
        paddingBottom: 10,
    },
    // New additions
    loadingIndicator: {
        marginTop: 10,
    },
    scheduledListContainer: {
        flex: 1,
        marginTop: 10,
    },
});

export default ChatRoomScreenStyles;

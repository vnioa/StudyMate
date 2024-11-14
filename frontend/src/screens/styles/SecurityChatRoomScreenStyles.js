import { StyleSheet } from 'react-native';

const SecurityChatRoomScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#e9ecef',
        borderRadius: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    encryptedMessageContainer: {
        backgroundColor: '#d1ecf1',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    encryptedMessageText: {
        color: '#0c5460',
        fontSize: 14,
        fontStyle: 'italic',
    },
    decryptedMessageContainer: {
        backgroundColor: '#c3e6cb',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    decryptedMessageText: {
        color: '#155724',
        fontSize: 14,
    },
    buttonContainer: {
        marginBottom: 10,
    },
});

export default SecurityChatRoomScreenStyles;

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    container: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#E5E5EA',
    },
    verificationContainer: {
        marginTop: 24,
    },
    verificationCodeInput: {
        marginTop: 8,
    },
    resultContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
    },
    resultText: {
        fontSize: 16,
        color: '#1976D2',
        textAlign: 'center',
        fontWeight: '500',
    },
    timerText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        marginTop: 8,
    }
});
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    innerContainer: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#1A1A1A',
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    eyeIcon: {
        padding: 8,
    },
    strengthBarBackground: {
        height: 4,
        backgroundColor: '#E5E5EA',
        borderRadius: 2,
        marginBottom: 8,
    },
    strengthBar: {
        height: 4,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 16,
        textAlign: 'right',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#E5E5EA',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
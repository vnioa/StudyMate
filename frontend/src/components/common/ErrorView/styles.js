// components/common/ErrorView/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 8,
        minHeight: 160,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    icon: {
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#991B1B',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
        fontWeight: '500',
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    // 반응형 스타일
    '@media (min-width: 768px)': {
        container: {
            maxWidth: 400,
            alignSelf: 'center',
        },
    },
    // 다크모드 스타일
    '@media (prefers-color-scheme: dark)': {
        container: {
            backgroundColor: '#7F1D1D',
        },
        message: {
            color: '#FEE2E2',
        },
        retryButton: {
            backgroundColor: '#991B1B',
        },
    }
});
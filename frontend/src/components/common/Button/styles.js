// components/common/Button/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    button: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 16,
        overflow: 'hidden',
    },

    // 크기별 스타일
    buttonSmall: {
        height: 32,
        paddingHorizontal: 12,
    },
    buttonMedium: {
        height: 40,
        paddingHorizontal: 16,
    },
    buttonLarge: {
        height: 48,
        paddingHorizontal: 20,
    },

    // 타입별 스타일
    buttonPrimary: {
        backgroundColor: '#007AFF',
        borderWidth: 0,
    },
    buttonSecondary: {
        backgroundColor: '#E5E5EA',
        borderWidth: 0,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    buttonGhost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    buttonDanger: {
        backgroundColor: '#FF3B30',
        borderWidth: 0,
    },

    // 비활성화 스타일
    buttonDisabled: {
        opacity: 0.5,
    },

    // 컨텐츠 컨테이너
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // 텍스트 기본 스타일
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },

    // 텍스트 크기별 스타일
    textSmall: {
        fontSize: 14,
    },
    textMedium: {
        fontSize: 16,
    },
    textLarge: {
        fontSize: 18,
    },

    // 텍스트 타입별 스타일
    textPrimary: {
        color: '#FFFFFF',
    },
    textSecondary: {
        color: '#000000',
    },
    textOutline: {
        color: '#007AFF',
    },
    textGhost: {
        color: '#007AFF',
    },
    textDanger: {
        color: '#FFFFFF',
    },

    // 텍스트 비활성화 스타일
    textDisabled: {
        color: '#999999',
    },

    // 아이콘 스타일
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },

    // 그림자 스타일
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // 반응형 스타일
    '@media (min-width: 768px)': {
        buttonSmall: {
            height: 36,
            paddingHorizontal: 14,
        },
        buttonMedium: {
            height: 44,
            paddingHorizontal: 18,
        },
        buttonLarge: {
            height: 52,
            paddingHorizontal: 22,
        },
    },
});
// components/common/CircularProgress/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        transform: [{ rotate: '-90deg' }]
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
        textAlign: 'center',
    },
    // 애니메이션 스타일
    progressAnimation: {
        position: 'absolute',
    },
    // 반응형 스타일
    '@media (min-width: 768px)': {
        percentageText: {
            fontSize: 28,
        },
        label: {
            fontSize: 16,
        },
    },
    // 다크모드 스타일
    '@media (prefers-color-scheme: dark)': {
        percentageText: {
            color: '#FFFFFF',
        },
        label: {
            color: '#A1A1A1',
        },
    }
});
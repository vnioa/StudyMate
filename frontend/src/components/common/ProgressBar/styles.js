// components/common/ProgressBar/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#E5E5EA',
        position: 'relative'
    },
    progress: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#007AFF',
    },
    // 그라데이션 효과를 위한 스타일
    gradient: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        right: 0
    },
    // 애니메이션 효과를 위한 스타일
    shine: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        transform: [{ skewX: '-20deg' }]
    },
    // 인디케이터 스타일
    indicator: {
        position: 'absolute',
        right: -8,
        top: '50%',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        transform: [{ translateY: -8 }]
    },
    // 반응형 스타일
    '@media (min-width: 768px)': {
        container: {
            height: 12
        },
        indicator: {
            width: 20,
            height: 20,
            borderRadius: 10,
            transform: [{ translateY: -10 }]
        }
    },
    // 다크모드 스타일
    '@media (prefers-color-scheme: dark)': {
        container: {
            backgroundColor: '#2C2C2E'
        },
        indicator: {
            backgroundColor: '#48484A'
        }
    }
});
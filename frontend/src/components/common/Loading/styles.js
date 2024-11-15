// components/common/Loading/styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        minHeight: 100
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 999,
        elevation: 10
    },
    content: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        alignItems: 'center'
    },
    spinner: {
        marginBottom: 8
    },
    message: {
        fontSize: 14,
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '500'
    },
    // 크기별 스타일
    small: {
        padding: 12
    },
    large: {
        padding: 20
    },
    // 애니메이션 관련 스타일
    fadeIn: {
        opacity: 1,
        transform: [{ scale: 1 }]
    },
    fadeOut: {
        opacity: 0,
        transform: [{ scale: 0.9 }]
    },
    // 반응형 스타일
    '@media (min-width: 768px)': {
        content: {
            minWidth: 200
        }
    }
});
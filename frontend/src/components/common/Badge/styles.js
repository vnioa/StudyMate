// components/common/Badge/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    badgeSmall: {
        height: 24,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badgeMedium: {
        height: 32,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    badgeLarge: {
        height: 40,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    icon: {
        marginRight: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    labelSmall: {
        fontSize: 12,
    },
    countContainer: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        paddingHorizontal: 6,
    },
    count: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    animate: {
        transform: [{ scale: 1 }],
        opacity: 1,
        animation: 'badgePop 0.3s ease-out',
    },
    '@keyframes badgePop': {
        '0%': {
            transform: [{ scale: 0.8 }],
            opacity: 0,
        },
        '50%': {
            transform: [{ scale: 1.1 }],
        },
        '100%': {
            transform: [{ scale: 1 }],
            opacity: 1,
        },
    }
});
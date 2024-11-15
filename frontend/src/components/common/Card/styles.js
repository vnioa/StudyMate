// components/common/Card/styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },

    // 썸네일 스타일
    thumbnailContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 16 / 9,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    durationText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    trendingBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendingText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },

    // 콘텐츠 스타일
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 12,
        lineHeight: 20,
    },

    // 메타 정보 스타일
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        fontSize: 14,
        color: '#666666',
        marginLeft: 4,
    },

    // 진행도 스타일
    progressContainer: {
        marginTop: 8,
    },
    progressText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
        textAlign: 'right',
    },

    // 변형 스타일
    default: {
        width: '100%',
        marginBottom: 16,
    },
    compact: {
        width: width * 0.7,
        marginRight: 12,
    },
    featured: {
        width: '100%',
        marginBottom: 24,
    },

    // 반응형 스타일
    '@media (min-width: 768px)': {
        compact: {
            width: width * 0.4,
        },
    },

    // 다크모드 스타일
    '@media (prefers-color-scheme: dark)': {
        container: {
            backgroundColor: '#1C1C1E',
        },
        title: {
            color: '#FFFFFF',
        },
        description: {
            color: '#A1A1A1',
        },
        metaText: {
            color: '#A1A1A1',
        },
    }
});
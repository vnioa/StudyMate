// features/home/screens/HomeScreen/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    container: {
        flex: 1,
    },
    // 섹션 공통 스타일
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    // 반응형 스타일
    '@media (min-width: 768px)': {
        container: {
            paddingHorizontal: 24,
        },
        sectionTitle: {
            fontSize: 24,
        },
    },
    // 다크모드 스타일
    '@media (prefers-color-scheme: dark)': {
        safeArea: {
            backgroundColor: '#1A1A1A',
        },
        sectionTitle: {
            color: '#FFFFFF',
        },
    }
});
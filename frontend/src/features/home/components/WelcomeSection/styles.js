// features/home/components/WelcomeSection/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A'
    },
    viewAll: {
        fontSize: 14,
        color: '#007AFF'
    }
});
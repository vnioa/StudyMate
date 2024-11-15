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
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 30,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 25,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
    },
    icon: {
        marginRight: 10,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
    },
    loginButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        width: '80%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '80%',
    },
    footerText: {
        color: '#0057D9',
        fontWeight: 'bold',
        fontSize: 14,
        padding: 5,
    },
});
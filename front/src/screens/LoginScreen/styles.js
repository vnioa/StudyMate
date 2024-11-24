import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 25,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    icon: { marginRight: 10 },
    input: { flex: 1, height: 44, fontSize: 16 },
    eyeIcon: { position: 'absolute', right: 15 },
    loginButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
        width: '80%',
    },
    googleButton: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    googleButtonText: { marginLeft: 8 },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18, // 버튼 텍스트 크기
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '80%',
    },
    linkText: {
        color: '#0057D9',
        fontWeight: 'bold',
        fontSize: 14, // 링크 텍스트 크기
    },
});
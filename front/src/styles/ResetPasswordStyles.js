import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef2f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '90%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    inputIcon: {
        marginLeft: 10,
    },
    input: {
        flex: 1,
        height: 44,
        paddingHorizontal: 10,
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
    },
    strengthBarBackground: {
        height: 5,
        backgroundColor: '#ddd',
        borderRadius: 5,
        marginVertical: 5,
    },
    strengthBar: {
        height: 5,
        borderRadius: 5,
    },
    passwordStrength: {
        marginBottom: 10,
        fontSize: 14,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#0057D9',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems:"center"
    },
    buttonDisabled:{
        background:"#999"
    },
});

export default styles;
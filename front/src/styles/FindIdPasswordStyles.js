import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 20,
    },
    avoidingView: {
        flex: 1,
        justifyContent: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#ddd',
    },
    activeTab: {
        borderBottomColor: '#0057D9',
    },
    tabText: {
        fontSize: 16,
        color: '#888',
    },
    activeTabText: {
        color: '#0057D9',
        fontWeight: 'bold',
    },
    formContainer: {
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3, // Android 그림자
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#333', // 입력 텍스트 색상
    },
    buttonContainer: {
        marginTop: 20,
    },
    buttonTextContainer: {
        fontSize: "15px",
        color: "#red"
    },
    buttonText: {
        fontWeight: 'bold',
        color: "#fff",
        fontSize: "18px"
    },
    resultContainer: {
        marginTop: 10,
        padding: 15,
        backgroundColor: '#e0f7fa', // 밝은 청록색 배경
        borderRadius: 10, // 둥근 모서리
        alignItems: 'center', // 텍스트를 중앙 정렬
    },
    resultText: {
        fontSize: 16,
        color: '#00796b', // 진한 청록색 텍스트
        textAlign: 'center', // 텍스트 중앙 정렬
    },
})
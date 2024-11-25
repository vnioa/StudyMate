import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {authAPI} from "../../services/api";

const FindAccountScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('id'); // 'id' or 'password'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        authCode: '',
        userId: '', // 비밀번호 찾기에서 사용
    });
    const [isAuthCodeSent, setIsAuthCodeSent] = useState(false);
    const [isAuthCodeVerified, setIsAuthCodeVerified] = useState(false);

    // 인증코드 발송
    const handleSendAuthCode = async () => {
        try {
            const response = await authAPI.sendAuthCode({
                name: formData.name,
                email: formData.email,
                type: activeTab,
                userId: activeTab === 'password' ? formData.userId : undefined,
            });

            if (response.data.success) {
                setIsAuthCodeSent(true);
                Alert.alert('알림', '인증코드가 발송되었습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '인증코드 발송에 실패했습니다.');
        }
    };

    // 인증코드 확인
    const handleVerifyCode = async () => {
        try {
            const response = await authAPI.verifyAuthCode({
                email: formData.email,
                authCode: formData.authCode,
                type: activeTab,
            });

            if (response.data.success) {
                setIsAuthCodeVerified(true);
                if (activeTab === 'id') {
                    Alert.alert(
                        '아이디 찾기 결과',
                        `회원님의 아이디는 ${response.data.userId} 입니다.`,
                        [
                            {
                                text: '확인',
                                onPress: () => navigation.navigate('Login')
                            }
                        ]
                    );
                }
            }
        } catch (error) {
            Alert.alert('오류', '인증코드가 일치하지 않습니다.');
        }
    };

    // 비밀번호 재설정 페이지로 이동
    const handleResetPassword = () => {
        if (isAuthCodeVerified) {
            navigation.navigate('ResetPassword', {
                email: formData.email,
                userId: formData.userId
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'id' && styles.activeTab]}
                    onPress={() => setActiveTab('id')}
                >
                    <Text style={[styles.tabText, activeTab === 'id' && styles.activeTabText]}>
                        아이디 찾기
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'password' && styles.activeTab]}
                    onPress={() => setActiveTab('password')}
                >
                    <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                        비밀번호 찾기
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'password' && (
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="아이디"
                        value={formData.userId}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, userId: text }))}
                        autoCapitalize="none"
                    />
                </View>
            )}

            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="이름"
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <TextInput
                    style={styles.input}
                    placeholder="등록된 이메일"
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TouchableOpacity
                    style={[styles.checkButton, isAuthCodeSent && styles.checkedButton]}
                    onPress={handleSendAuthCode}
                >
                    <Text style={styles.checkButtonText}>인증코드 발송</Text>
                </TouchableOpacity>
            </View>

            {isAuthCodeSent && (
                <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="인증코드 입력"
                        value={formData.authCode}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, authCode: text }))}
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity
                        style={[styles.checkButton, isAuthCodeVerified && styles.checkedButton]}
                        onPress={handleVerifyCode}
                    >
                        <Text style={styles.checkButtonText}>코드확인</Text>
                    </TouchableOpacity>
                </View>
            )}

            {activeTab === 'password' && isAuthCodeVerified && (
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleResetPassword}
                >
                    <Text style={styles.resetButtonText}>비밀번호 설정</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#0066FF',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#0066FF',
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    checkButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    checkedButton: {
        backgroundColor: '#4CAF50',
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    resetButton: {
        backgroundColor: '#4CAF50',
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default FindAccountScreen;
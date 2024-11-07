import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Animated, Easing, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const FindIdPasswordScreen = ({ navigation }) => {
    const [isIdTab, setIsIdTab] = useState(true); // 탭 전환 상태
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [receivedCode, setReceivedCode] = useState('');
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [foundUsername, setFoundUsername] = useState('');
    const slideAnim = new Animated.Value(0); // 애니메이션 초기 설정

    // 탭 전환 애니메이션
    const handleTabChange = (toIdTab) => {
        setIsIdTab(toIdTab);
        Animated.timing(slideAnim, {
            toValue: toIdTab ? 0 : 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    };

    // 이메일 인증 코드 요청
    const requestVerificationCodeForId = async () => {
        if (!name || !email) {
            Alert.alert('이름과 이메일을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/send-verification-code', {
                email,
            });

            if (response.data.success) {
                setReceivedCode(response.data.code); // 서버에서 받은 인증 코드 저장
                Alert.alert('인증 코드가 발송되었습니다.');
            } else {
                Alert.alert('인증 코드 발송에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            Alert.alert('인증 코드 발송 요청에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 인증 코드 검증
    const verifyCodeForId = async () => {
        if (verificationCode === receivedCode) {
            setIsCodeVerified(true);
            Alert.alert('인증이 완료되었습니다.');
        } else {
            Alert.alert('인증 코드가 일치하지 않습니다.');
        }
    };

    // 아이디 찾기 요청 (인증 완료 후)
    const handleFindId = async () => {
        if (!isCodeVerified) {
            Alert.alert('이메일 인증을 먼저 완료해주세요.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/find-id', {
                name,
                email,
            });

            if (response.data.success) {
                setFoundUsername(response.data.username);
                Alert.alert('아이디 찾기 성공', `아이디는 ${response.data.username}입니다.`);
            } else {
                Alert.alert('입력한 정보와 일치하는 아이디가 없습니다.');
            }
        } catch (error) {
            Alert.alert('아이디 찾기 요청에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 비밀번호 찾기 인증코드 요청
    const requestVerificationCodeForPassword = async () => {
        if (!username || !email) {
            Alert.alert('아이디와 이메일을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await axios.post('http://121.127.165.43:3000/api/users/send-verification-code', {
                username,
                email,
            });

            if (response.data.success) {
                setReceivedCode(response.data.code); // 서버에서 받은 인증 코드 저장
                Alert.alert('인증 코드가 발송되었습니다.');
            } else {
                Alert.alert('입력한 정보와 일치하는 계정을 찾을 수 없습니다.');
            }
        } catch (error) {
            Alert.alert('인증 코드 요청에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 인증 코드 검증
    const verifyCodeForPassword = () => {
        if (verificationCode === receivedCode) {
            setIsCodeVerified(true);
            Alert.alert('인증이 완료되었습니다.');
        } else {
            Alert.alert('인증 코드가 일치하지 않습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.avoidingView}>
                {/* 탭 전환 버튼 */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, isIdTab && styles.activeTab]}
                        onPress={() => handleTabChange(true)}
                    >
                        <Text style={[styles.tabText, isIdTab && styles.activeTabText]}>아이디 찾기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, !isIdTab && styles.activeTab]}
                        onPress={() => handleTabChange(false)}
                    >
                        <Text style={[styles.tabText, !isIdTab && styles.activeTabText]}>비밀번호 찾기</Text>
                    </TouchableOpacity>
                </View>

                <Animated.View
                    style={[
                        styles.formContainer,
                        {
                            transform: [
                                {
                                    translateX: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, -400], // 탭 전환 시 슬라이드 효과
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {/* 아이디 찾기 탭 */}
                    {isIdTab ? (
                        <View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="이름"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#888"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="등록된 이메일"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#888"
                                />
                            </View>
                            {/* 인증 코드 발송 및 확인 */}
                            {!isCodeVerified && (
                                <>
                                    <TouchableOpacity style={styles.button} onPress={requestVerificationCodeForId}>
                                        <Text style={styles.buttonText}>인증코드 발송</Text>
                                    </TouchableOpacity>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="key-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="인증코드를 입력하세요"
                                            value={verificationCode}
                                            onChangeText={setVerificationCode}
                                            keyboardType="numeric"
                                            placeholderTextColor="#888"
                                        />
                                    </View>
                                    <TouchableOpacity style={styles.button} onPress={verifyCodeForId}>
                                        <Text style={styles.buttonText}>코드 확인</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {/* 아이디 찾기 버튼은 인증 후에만 활성화 */}
                            {isCodeVerified && (
                                <TouchableOpacity style={styles.button} onPress={handleFindId}>
                                    <Text style={styles.buttonText}>아이디 찾기</Text>
                                </TouchableOpacity>
                            )}
                            {/* 찾은 아이디 표시 */}
                            {foundUsername && (
                                <View style={styles.resultContainer}>
                                    <Text style={styles.resultText}>찾은 아이디: {foundUsername}</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        // 비밀번호 찾기 탭
                        <View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="아이디"
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholderTextColor="#888"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="등록된 이메일"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#888"
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={requestVerificationCodeForPassword}>
                                <Text style={styles.buttonText}>인증코드 발송</Text>
                            </TouchableOpacity>
                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color="#0057D9" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="인증코드를 입력하세요"
                                    value={verificationCode}
                                    onChangeText={setVerificationCode}
                                    keyboardType="numeric"
                                    placeholderTextColor="#888"
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={verifyCodeForPassword}>
                                <Text style={styles.buttonText}>코드 확인</Text>
                            </TouchableOpacity>

                            {/* 인증에 성공하면 비밀번호 재설정 버튼 활성화 */}
                            {isCodeVerified && (
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => navigation.navigate('ResetPasswordScreen')}
                                >
                                    <Text style={styles.buttonText}>비밀번호 재설정</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    avoidingView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
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
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#0057D9',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    resetButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultContainer: {
        marginTop: 10,
        padding: 15,
        backgroundColor: '#e0f7fa',
        borderRadius: 10,
    },
    resultText: {
        fontSize: 16,
        color: '#00796b',
        textAlign: 'center',
    },
});

export default FindIdPasswordScreen;

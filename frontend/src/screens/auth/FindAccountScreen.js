import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    BackHandler,
} from 'react-native';
import {authAPI} from "../../services/api";
import Icon from "react-native-vector-icons/Feather";

const FindAccountScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('id');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        authCode: '',
        userId: ''
    });
    const [isAuthCodeSent, setIsAuthCodeSent] = useState(false);
    const [isAuthCodeVerified, setIsAuthCodeVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        userId: '',
        authCode: ''
    });

    useEffect(() => {
        let interval;
        if (isAuthCodeSent && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isAuthCodeSent, timer]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isAuthCodeSent || isAuthCodeVerified) {
                Alert.alert(
                    '진행 중인 인증',
                    '인증 진행을 취소하시겠습니까?',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '확인', onPress: () => navigation.goBack() }
                    ]
                );
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [isAuthCodeSent, isAuthCodeVerified]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFormData({
            name: '',
            email: '',
            authCode: '',
            userId: ''
        });
        setIsAuthCodeSent(false);
        setIsAuthCodeVerified(false);
        setErrors({});
        setTimer(0);
    };

    const handleSendAuthCode = async () => {
        if (!formData.email || !formData.name || (activeTab === 'password' && !formData.userId)) {
            Alert.alert('오류', '모든 필수 정보를 입력해주세요.');
            return;
        }

        if (!validateEmail(formData.email)) {
            setErrors(prev => ({
                ...prev,
                email: '올바른 이메일 형식이 아닙니다.'
            }));
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.sendAuthCode({
                name: formData.name.trim(),
                email: formData.email.trim(),
                type: activeTab,
                userId: activeTab === 'password' ? formData.userId.trim() : undefined
            });

            if (response.data.success) {
                setIsAuthCodeSent(true);
                setTimer(180);
                Alert.alert('알림', '인증코드가 발송되었습니다.\n이메일을 확인해주세요.');
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '인증코드 발송에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!formData.authCode) {
            setErrors(prev => ({
                ...prev,
                authCode: '인증코드를 입력해주세요.'
            }));
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.verifyAuthCode({
                email: formData.email.trim(),
                authCode: formData.authCode.trim(),
                type: activeTab
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
                                onPress: () => {
                                    navigation.navigate('Login', {
                                        userId: response.data.userId
                                    });
                                }
                            }
                        ]
                    );
                }
            }
        } catch (error) {
            const errorMessage = error.response?.status === 400
                ? '인증코드가 일치하지 않습니다.'
                : '인증 처리 중 오류가 발생했습니다.';
            Alert.alert('오류', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = () => {
        if (!isAuthCodeVerified) {
            Alert.alert('알림', '이메일 인증을 먼저 완료해주세요.');
            return;
        }

        if (!formData.email || !formData.userId) {
            Alert.alert('오류', '필수 정보가 누락되었습니다.');
            return;
        }

        navigation.navigate('ResetPassword', {
            email: formData.email.trim(),
            userId: formData.userId.trim(),
            onPasswordReset: () => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }]
                });
            }
        });
    };
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>계정 찾기</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'id' && styles.activeTab]}
                    onPress={() => handleTabChange('id')}
                    disabled={loading}
                >
                    <Text style={[styles.tabText, activeTab === 'id' && styles.activeTabText]}>
                        아이디 찾기
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'password' && styles.activeTab]}
                    onPress={() => handleTabChange('password')}
                    disabled={loading}
                >
                    <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
                        비밀번호 찾기
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>아이디</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, name: text }));
                            setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="아이디를 입력하세요"
                        editable={!loading}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>이메일</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.email}
                        onChangeText={(text) => {
                            setFormData(prev => ({ ...prev, email: text }));
                            setErrors(prev => ({ ...prev, email: '' }));
                        }}
                        placeholder="이메일을 입력하세요"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {activeTab === 'password' && (
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>아이디</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.userId}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, userId: text }));
                                setErrors(prev => ({ ...prev, userId: '' }));
                            }}
                            placeholder="아이디를 입력하세요"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                        {errors.userId && <Text style={styles.errorText}>{errors.userId}</Text>}
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.checkButton,
                        isAuthCodeSent && styles.checkedButton,
                        loading && styles.buttonDisabled
                    ]}
                    onPress={handleSendAuthCode}
                    disabled={loading || isAuthCodeVerified}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.checkButtonText}>
                            {isAuthCodeSent ? '인증코드 재발송' : '인증코드 발송'}
                        </Text>
                    )}
                </TouchableOpacity>

                {isAuthCodeSent && (
                    <View style={styles.inputContainer}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>인증코드</Text>
                            {timer > 0 && (
                                <Text style={styles.timer}>
                                    {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                                </Text>
                            )}
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.authCode}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, authCode: text }));
                                setErrors(prev => ({ ...prev, authCode: '' }));
                            }}
                            placeholder="인증코드를 입력하세요"
                            keyboardType="number-pad"
                            editable={!loading && !isAuthCodeVerified}
                        />
                        {errors.authCode && <Text style={styles.errorText}>{errors.authCode}</Text>}
                    </View>
                )}

                {isAuthCodeSent && !isAuthCodeVerified && (
                    <TouchableOpacity
                        style={[styles.verifyButton, loading && styles.buttonDisabled]}
                        onPress={handleVerifyCode}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.verifyButtonText}>인증코드 확인</Text>
                        )}
                    </TouchableOpacity>
                )}

                {activeTab === 'password' && isAuthCodeVerified && (
                    <TouchableOpacity
                        style={[styles.resetButton, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <Text style={styles.resetButtonText}>비밀번호 재설정</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
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
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    timer: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    checkButton: {
        backgroundColor: '#0066FF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    checkedButton: {
        backgroundColor: '#666',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    verifyButton: {
        backgroundColor: '#0066FF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resetButton: {
        backgroundColor: '#0066FF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default FindAccountScreen;
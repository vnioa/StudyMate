import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import axios from "axios";

const BASE_URL = 'http://172.17.195.130:3000';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const EditInfoScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userInfo, setUserInfo] = useState({
        name: '',
        phone: '',
        birthdate: '',
        id: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const inputRefs = {
        name: React.createRef(),
        phone: React.createRef(),
        birthdate: React.createRef(),
        password: React.createRef(),
        confirmPassword: React.createRef()
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getUserInfo();
            if (response.data) {
                setUserInfo({
                    ...response.data,
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const focusNextInput = (currentField) => {
        const fields = ['name', 'phone', 'birthdate', 'password', 'confirmPassword'];
        const currentIndex = fields.indexOf(currentField);
        const nextField = fields[currentIndex + 1];

        if (nextField && inputRefs[nextField].current) {
            inputRefs[nextField].current.focus();
        }
    };

    const handleChange = (field, value) => {
        setUserInfo(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!userInfo.name.trim()) {
            newErrors.name = '이름을 입력해주세요';
        }

        if (!userInfo.phone.trim()) {
            newErrors.phone = '전화번호를 입력해주세요';
        } else if (!/^\d{3}-\d{4}-\d{4}$/.test(userInfo.phone)) {
            newErrors.phone = '올바른 전화번호 형식이 아닙니다';
        }

        if (!userInfo.birthdate.trim()) {
            newErrors.birthdate = '생년월일을 입력해주세요';
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(userInfo.birthdate)) {
            newErrors.birthdate = '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)';
        }

        if (userInfo.password) {
            if (userInfo.password.length < 6) {
                newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
            }
            if (userInfo.password !== userInfo.confirmPassword) {
                newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await userAPI.updateUserInfo({
                name: userInfo.name,
                phone: userInfo.phone,
                birthdate: userInfo.birthdate,
                password: userInfo.password || undefined
            });

            if (response.data.success) {
                Alert.alert('성공', '정보가 수정되었습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', '정보 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const renderInput = useMemo(() => (field, placeholder, options = {}) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{placeholder}</Text>
            <TextInput
                style={[
                    styles.input,
                    errors[field] && styles.inputError,
                    options.disabled && styles.disabledInput
                ]}
                value={userInfo[field]}
                onChangeText={(value) => handleChange(field, value)}
                placeholder={placeholder}
                editable={!options.disabled}
                secureTextEntry={options.secure}
                keyboardType={options.keyboardType || 'default'}
                returnKeyType={options.returnKeyType || 'next'}
                ref={inputRefs[field]}
                onSubmitEditing={() => focusNextInput(field)}
                {...options}
            />
            {errors[field] && (
                <Text style={styles.errorText}>{errors[field]}</Text>
            )}
        </View>
    ), [userInfo, errors]);

    if (loading && !userInfo.name) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>정보 수정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchUserInfo}
                        colors={['#4A90E2']}
                    />
                }
            >
                {renderInput('name', '이름')}
                {renderInput('phone', '전화번호', { keyboardType: 'phone-pad' })}
                {renderInput('birthdate', '생년월일', { keyboardType: 'numeric' })}
                {renderInput('id', '아이디', { disabled: true })}
                {renderInput('email', '이메일', { disabled: true })}
                {renderInput('password', '새 비밀번호', { secure: true })}
                {renderInput('confirmPassword', '비밀번호 재입력', {
                    secure: true,
                    returnKeyType: 'done'
                })}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? '처리중...' : '변경하기'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#666',
    },
    button: {
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default EditInfoScreen;
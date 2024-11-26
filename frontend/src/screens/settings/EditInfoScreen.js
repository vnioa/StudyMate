import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { userAPI } from '../../services/api';

const EditInfoScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
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

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getUserInfo();
            setUserInfo({
                ...response.data,
                password: '',
                confirmPassword: ''
            });
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '사용자 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setUserInfo(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
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
            Alert.alert('오류', error.response?.data?.message || '정보 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>정보 수정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>이름</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        value={userInfo.name}
                        onChangeText={(value) => handleChange('name', value)}
                        placeholder="이름을 입력하세요"
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>전화번호</Text>
                    <TextInput
                        style={[styles.input, errors.phone && styles.inputError]}
                        value={userInfo.phone}
                        onChangeText={(value) => handleChange('phone', value)}
                        placeholder="010-XXXX-XXXX"
                        keyboardType="phone-pad"
                    />
                    {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>생년월일</Text>
                    <TextInput
                        style={[styles.input, errors.birthdate && styles.inputError]}
                        value={userInfo.birthdate}
                        onChangeText={(value) => handleChange('birthdate', value)}
                        placeholder="YYYY-MM-DD"
                    />
                    {errors.birthdate && <Text style={styles.errorText}>{errors.birthdate}</Text>}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>아이디</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={userInfo.id}
                        editable={false}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>이메일</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={userInfo.email}
                        editable={false}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>새 비밀번호</Text>
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        value={userInfo.password}
                        onChangeText={(value) => handleChange('password', value)}
                        secureTextEntry
                        placeholder="변경하려면 입력하세요"
                    />
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>비밀번호 재입력</Text>
                    <TextInput
                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                        value={userInfo.confirmPassword}
                        onChangeText={(value) => handleChange('confirmPassword', value)}
                        secureTextEntry
                        placeholder="비밀번호를 다시 입력하세요"
                    />
                    {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                </View>

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
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
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
    content: {
        flex: 1,
        padding: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
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
        backgroundColor: '#0066FF',
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
        fontWeight: 'bold',
    },
});

export default EditInfoScreen;
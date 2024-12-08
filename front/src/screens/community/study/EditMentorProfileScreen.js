import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const EditMentorProfileScreen = ({ navigation, route }) => {
    const { mentorId, currentData } = route.params;
    const [formData, setFormData] = useState({
        field: currentData.field || '',
        experience: currentData.experience || '',
        introduction: currentData.introduction || ''
    });
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    const checkNetwork = async () => {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            setIsOnline(false);
            Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
            return false;
        }
        setIsOnline(true);
        return true;
    };

    const validateForm = () => {
        if (!formData.field.trim()) {
            Alert.alert('오류', '전문 분야를 입력해주세요');
            return false;
        }
        if (!formData.experience.trim()) {
            Alert.alert('오류', '경력을 입력해주세요');
            return false;
        }
        if (!formData.introduction.trim()) {
            Alert.alert('오류', '자기소개를 입력해주세요');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateForm() || !(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.put(`/api/mentors/${mentorId}/profile`, formData);

            if (response.data.success) {
                await AsyncStorage.setItem(`mentorProfile_${mentorId}`,
                    JSON.stringify(formData));

                Alert.alert('성공', '멘토 정보가 수정되었습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '멘토 정보 수정에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        const hasChanges =
            formData.field !== currentData.field ||
            formData.experience !== currentData.experience ||
            formData.introduction !== currentData.introduction;

        if (hasChanges) {
            Alert.alert(
                '변경 사항 저장',
                '변경된 내용이 있습니다. 저장하지 않고 나가시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '나가기',
                        style: 'destructive',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>프로필 수정</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading || !isOnline}
                >
                    <Text style={[
                        styles.saveButton,
                        (!isOnline || loading) && styles.saveButtonDisabled
                    ]}>저장</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>전문 분야</Text>
                    <TextInput
                        style={[
                            styles.input,
                            !isOnline && styles.inputDisabled
                        ]}
                        value={formData.field}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, field: text }))}
                        placeholder="전문 분야를 입력하세요"
                        placeholderTextColor={theme.colors.textTertiary}
                        editable={!loading && isOnline}
                        maxLength={50}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>경력</Text>
                    <TextInput
                        style={[
                            styles.input,
                            styles.multilineInput,
                            !isOnline && styles.inputDisabled
                        ]}
                        value={formData.experience}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, experience: text }))}
                        placeholder="경력을 입력하세요"
                        placeholderTextColor={theme.colors.textTertiary}
                        multiline
                        editable={!loading && isOnline}
                        maxLength={500}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>자기소개</Text>
                    <TextInput
                        style={[
                            styles.input,
                            styles.multilineInput,
                            !isOnline && styles.inputDisabled
                        ]}
                        value={formData.introduction}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, introduction: text }))}
                        placeholder="자기소개를 입력하세요"
                        placeholderTextColor={theme.colors.textTertiary}
                        multiline
                        editable={!loading && isOnline}
                        maxLength={1000}
                    />
                </View>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    saveButton: {
        color: theme.colors.primary,
        ...theme.typography.bodyLarge,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        color: theme.colors.textDisabled,
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    inputGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.sm,
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    multilineInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default EditMentorProfileScreen;
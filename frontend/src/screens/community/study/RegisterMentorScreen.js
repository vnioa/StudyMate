import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform, TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { mentorAPI } from '../../../services/api';
import * as ImagePicker from 'expo-image-picker';

const RegisterMentorScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        field: '',
        career: '',
        introduction: '',
        education: '',
        skills: '',
        availableTime: '',
        profileImage: null
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ['name', 'field', 'career', 'introduction'];

        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = '필수 입력 항목입니다';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageUpload = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('권한 필요', '이미지 업로드를 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploading(true);
                const imageUri = result.assets[0].uri;
                const formData = new FormData();
                formData.append('image', {
                    uri: imageUri,
                    type: 'image/jpeg',
                    name: 'profile-image.jpg',
                });

                const response = await mentorAPI.uploadMentorImage(formData);
                setFormData(prev => ({
                    ...prev,
                    profileImage: response.data.imageUrl
                }));
            }
        } catch (error) {
            Alert.alert('오류', '이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('알림', '필수 항목을 모두 입력해주세요.');
            return;
        }

        try {
            setLoading(true);

            // 유효성 검사
            await mentorAPI.validateMentorInfo(formData);

            // 멘토 등록
            const response = await mentorAPI.registerMentor(formData);

            Alert.alert(
                '멘토 등록',
                '멘토 등록이 완료되었습니다. 관리자 승인 후 활동이 가능합니다.',
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            const errorMessage = error.response?.data?.message || '멘토 등록에 실패했습니다.';
            Alert.alert('오류', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>멘토 등록</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>이름 *</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            placeholder="실명을 입력해주세요"
                            value={formData.name}
                            onChangeText={(text) => handleInputChange('name', text)}
                            maxLength={30}
                        />
                        {errors.name && (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>전문 분야 *</Text>
                        <TextInput
                            style={[styles.input, errors.field && styles.inputError]}
                            placeholder="예: 웹 개발, 모바일 앱 개발"
                            value={formData.field}
                            onChangeText={(text) => handleInputChange('field', text)}
                            maxLength={100}
                        />
                        {errors.field && (
                            <Text style={styles.errorText}>{errors.field}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>경력 사항 *</Text>
                        <TextInput
                            style={[styles.input, errors.career && styles.inputError]}
                            placeholder="관련 경력을 입력해주세요"
                            value={formData.career}
                            onChangeText={(text) => handleInputChange('career', text)}
                            maxLength={200}
                        />
                        {errors.career && (
                            <Text style={styles.errorText}>{errors.career}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>상세 정보</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>자기 소개 *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, errors.introduction && styles.inputError]}
                            placeholder="멘티들에게 보여질 자기소개를 작성해주세요"
                            multiline
                            numberOfLines={4}
                            value={formData.introduction}
                            onChangeText={(text) => handleInputChange('introduction', text)}
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>
                            {formData.introduction.length}/500
                        </Text>
                        {errors.introduction && (
                            <Text style={styles.errorText}>{errors.introduction}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>학력</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="최종 학력을 입력해주세요"
                            value={formData.education}
                            onChangeText={(text) => handleInputChange('education', text)}
                            maxLength={100}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>보유 기술</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="보유하신 기술을 입력해주세요"
                            value={formData.skills}
                            onChangeText={(text) => handleInputChange('skills', text)}
                            maxLength={200}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>멘토링 정보</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>가능 시간</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="멘토링 가능 시간을 입력해주세요"
                            value={formData.availableTime}
                            onChangeText={(text) => handleInputChange('availableTime', text)}
                            maxLength={100}
                        />
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            loading && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.submitButtonText}>멘토 등록 신청</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        padding: 15,
        marginBottom: 30,
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 12,
        marginTop: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    imageUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4A90E2',
        marginTop: 8,
    },
    imageUploadText: {
        color: '#4A90E2',
        marginLeft: 8,
    }
});

export default RegisterMentorScreen;
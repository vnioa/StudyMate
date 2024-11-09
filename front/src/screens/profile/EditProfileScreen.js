// src/screens/profile/EditProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import api from '../../services/api';

export default function EditProfileScreen() {
    const navigation = useNavigation();

    // 상태 관리
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({
        avatar: null,
        coverImage: null,
        name: '',
        statusMessage: '',
        email: '',
        phone: '',
        birthDate: '',
        school: '',
        major: '',
        interests: [],
        subjects: [],
        socialLinks: {
            github: '',
            linkedin: '',
            website: ''
        },
        privacySettings: {
            profileVisibility: 'public', // public, friends, private
            showActivity: true,
            showStats: true
        }
    });

    // 유효성 검사 상태
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // 관심사 입력 상태
    const [interestInput, setInterestInput] = useState('');
    const [subjectInput, setSubjectInput] = useState('');

    // 초기 데이터 로드
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const response = await api.profile.getProfile();
            setProfile(response);
        } catch (error) {
            Alert.alert('오류', '프로필 정보를 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    // 이미지 선택 (프로필/커버)
    const handleImagePick = async (type) => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'avatar' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setProfile(prev => ({
                    ...prev,
                    [type]: result.assets[0]
                }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            Alert.alert('오류', '이미지를 선택하는데 실패했습니다.');
        }
    };

    // 관심사 관리
    const handleAddInterest = () => {
        if (interestInput.trim() && profile.interests.length < 10) {
            setProfile(prev => ({
                ...prev,
                interests: [...prev.interests, interestInput.trim()]
            }));
            setInterestInput('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleRemoveInterest = (interestToRemove) => {
        setProfile(prev => ({
            ...prev,
            interests: prev.interests.filter(interest => interest !== interestToRemove)
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 과목 관리
    const handleAddSubject = () => {
        if (subjectInput.trim() && profile.subjects.length < 10) {
            setProfile(prev => ({
                ...prev,
                subjects: [...prev.subjects, {
                    name: subjectInput.trim(),
                    color: getRandomColor()
                }]
            }));
            setSubjectInput('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleRemoveSubject = (subjectToRemove) => {
        setProfile(prev => ({
            ...prev,
            subjects: prev.subjects.filter(subject => subject.name !== subjectToRemove)
        }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // 랜덤 색상 생성
    const getRandomColor = () => {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEEAD', '#D4A5A5', '#9FA8DA', '#CE93D8'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    // 유효성 검사
    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!profile.name.trim()) {
            newErrors.name = '이름을 입력해주세요';
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.email)) {
            newErrors.email = '올바른 이메일 주소를 입력해주세요';
            isValid = false;
        }

        const phoneRegex = /^[0-9]{10,11}$/;
        if (profile.phone && !phoneRegex.test(profile.phone)) {
            newErrors.phone = '올바른 전화번호를 입력해주세요';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // 프로필 저장
    const handleSave = async () => {
        if (!validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        try {
            setIsSaving(true);
            const formData = new FormData();

            // 기본 정보
            Object.keys(profile).forEach(key => {
                if (key !== 'avatar' && key !== 'coverImage') {
                    formData.append(key,
                        typeof profile[key] === 'object'
                            ? JSON.stringify(profile[key])
                            : profile[key]
                    );
                }
            });

            // 이미지 처리
            if (profile.avatar?.uri) {
                const avatarUri = profile.avatar.uri;
                const avatarName = avatarUri.split('/').pop();
                const avatarMatch = /\.(\w+)$/.exec(avatarName);
                const avatarType = avatarMatch ? `image/${avatarMatch[1]}` : 'image';

                formData.append('avatar', {
                    uri: avatarUri,
                    name: avatarName,
                    type: avatarType
                });
            }

            if (profile.coverImage?.uri) {
                const coverUri = profile.coverImage.uri;
                const coverName = coverUri.split('/').pop();
                const coverMatch = /\.(\w+)$/.exec(coverName);
                const coverType = coverMatch ? `image/${coverMatch[1]}` : 'image';

                formData.append('coverImage', {
                    uri: coverUri,
                    name: coverName,
                    type: coverType
                });
            }

            await api.profile.updateProfile(formData);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
        } catch (error) {
            Alert.alert('오류', '프로필 저장에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.scrollView}>
                {/* 커버 이미지 */}
                <TouchableOpacity
                    style={styles.coverImageContainer}
                    onPress={() => handleImagePick('coverImage')}
                >
                    {profile.coverImage ? (
                        <Image
                            source={{ uri: profile.coverImage.uri || profile.coverImage }}
                            style={styles.coverImage}
                        />
                    ) : (
                        <View style={styles.coverImagePlaceholder}>
                            <Ionicons name="image-outline" size={48} color={theme.colors.text.secondary} />
                            <Text style={styles.coverImageText}>커버 이미지 선택</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 프로필 이미지 */}
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={() => handleImagePick('avatar')}
                >
                    {profile.avatar ? (
                        <Image
                            source={{ uri: profile.avatar.uri || profile.avatar }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person-outline" size={48} color={theme.colors.text.secondary} />
                        </View>
                    )}
                    <View style={styles.avatarBadge}>
                        <Ionicons name="camera" size={20} color="white" />
                    </View>
                </TouchableOpacity>

                {/* 기본 정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>이름</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.name && styles.inputError
                            ]}
                            value={profile.name}
                            onChangeText={(text) => {
                                setProfile(prev => ({ ...prev, name: text }));
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            placeholder="이름을 입력하세요"
                        />
                        {errors.name && (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>상태 메시지</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={profile.statusMessage}
                            onChangeText={(text) =>
                                setProfile(prev => ({ ...prev, statusMessage: text }))
                            }
                            placeholder="상태 메시지를 입력하세요"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>이메일</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.email && styles.inputError
                            ]}
                            value={profile.email}
                            onChangeText={(text) => {
                                setProfile(prev => ({ ...prev, email: text }));
                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            placeholder="이메일을 입력하세요"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>전화번호</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.phone && styles.inputError
                            ]}
                            value={profile.phone}
                            onChangeText={(text) => {
                                setProfile(prev => ({ ...prev, phone: text }));
                                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            placeholder="전화번호를 입력하세요"
                            keyboardType="phone-pad"
                        />
                        {errors.phone && (
                            <Text style={styles.errorText}>{errors.phone}</Text>
                        )}
                    </View>
                </View>

                {/* 학력 정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>학력 정보</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>학교</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.school}
                            onChangeText={(text) =>
                                setProfile(prev => ({ ...prev, school: text }))
                            }
                            placeholder="학교를 입력하세요"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>전공</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.major}
                            onChangeText={(text) =>
                                setProfile(prev => ({ ...prev, major: text }))
                            }
                            placeholder="전공을 입력하세요"
                        />
                    </View>
                </View>

                {/* 관심사 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>관심사</Text>

                    <View style={styles.tagInput}>
                        <TextInput
                            style={styles.input}
                            value={interestInput}
                            onChangeText={setInterestInput}
                            placeholder="관심사를 입력하세요 (최대 10개)"
                            onSubmitEditing={handleAddInterest}
                        />
                        <TouchableOpacity
                            style={[
                                styles.tagAddButton,
                                (!interestInput.trim() || profile.interests.length >= 10) &&
                                styles.tagAddButtonDisabled
                            ]}
                            onPress={handleAddInterest}
                            disabled={!interestInput.trim() || profile.interests.length >= 10}
                        >
                            <Text style={styles.tagAddButtonText}>추가</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tags}>
                        {profile.interests.map((interest, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.tag}
                                onPress={() => handleRemoveInterest(interest)}
                            >
                                <Text style={styles.tagText}>{interest}</Text>
                                <Ionicons name="close-circle" size={16} color="white" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 과목 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>학습 과목</Text>

                    <View style={styles.tagInput}>
                        <TextInput
                            style={styles.input}
                            value={subjectInput}
                            onChangeText={setSubjectInput}
                            placeholder="과목을 입력하세요 (최대 10개)"
                            onSubmitEditing={handleAddSubject}
                        />
                        <TouchableOpacity
                            style={[
                                styles.tagAddButton,
                                (!subjectInput.trim() || profile.subjects.length >= 10) &&
                                styles.tagAddButtonDisabled
                            ]}
                            onPress={handleAddSubject}
                            disabled={!subjectInput.trim() || profile.subjects.length >= 10}
                        >
                            <Text style={styles.tagAddButtonText}>추가</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tags}>
                        {profile.subjects.map((subject, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.tag, { backgroundColor: subject.color }]}
                                onPress={() => handleRemoveSubject(subject.name)}
                            >
                                <Text style={styles.tagText}>{subject.name}</Text>
                                <Ionicons name="close-circle" size={16} color="white" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 소셜 링크 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>소셜 링크</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>GitHub</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.socialLinks.github}
                            onChangeText={(text) =>
                                setProfile(prev => ({
                                    ...prev,
                                    socialLinks: { ...prev.socialLinks, github: text }
                                }))
                            }
                            placeholder="GitHub 프로필 URL"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>LinkedIn</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.socialLinks.linkedin}
                            onChangeText={(text) =>
                                setProfile(prev => ({
                                    ...prev,
                                    socialLinks: { ...prev.socialLinks, linkedin: text }
                                }))
                            }
                            placeholder="LinkedIn 프로필 URL"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>개인 웹사이트</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.socialLinks.website}
                            onChangeText={(text) =>
                                setProfile(prev => ({
                                    ...prev,
                                    socialLinks: { ...prev.socialLinks, website: text }
                                }))
                            }
                            placeholder="웹사이트 URL"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* 공개 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>공개 설정</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>프로필 공개 범위</Text>
                            <Text style={styles.settingDescription}>
                                프로필을 볼 수 있는 사용자를 설정합니다
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.visibilityButton}
                            onPress={() => {
                                Alert.alert(
                                    '프로필 공개 범위',
                                    '프로필을 볼 수 있는 범위를 선택하세요',
                                    [
                                        {
                                            text: '전체 공개',
                                            onPress: () => setProfile(prev => ({
                                                ...prev,
                                                privacySettings: {
                                                    ...prev.privacySettings,
                                                    profileVisibility: 'public'
                                                }
                                            }))
                                        },
                                        {
                                            text: '친구만',
                                            onPress: () => setProfile(prev => ({
                                                ...prev,
                                                privacySettings: {
                                                    ...prev.privacySettings,
                                                    profileVisibility: 'friends'
                                                }
                                            }))
                                        },
                                        {
                                            text: '비공개',
                                            onPress: () => setProfile(prev => ({
                                                ...prev,
                                                privacySettings: {
                                                    ...prev.privacySettings,
                                                    profileVisibility: 'private'
                                                }
                                            }))
                                        },
                                        { text: '취소', style: 'cancel' }
                                    ]
                                );
                            }}
                        >
                            <Text style={styles.visibilityButtonText}>
                                {profile.privacySettings.profileVisibility === 'public'
                                    ? '전체 공개'
                                    : profile.privacySettings.profileVisibility === 'friends'
                                        ? '친구만'
                                        : '비공개'
                                }
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>활동 내역 공개</Text>
                            <Text style={styles.settingDescription}>
                                학습 활동 내역을 다른 사용자에게 공개합니다
                            </Text>
                        </View>
                        <Switch
                            value={profile.privacySettings.showActivity}
                            onValueChange={(value) =>
                                setProfile(prev => ({
                                    ...prev,
                                    privacySettings: {
                                        ...prev.privacySettings,
                                        showActivity: value
                                    }
                                }))
                            }
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={profile.privacySettings.showActivity
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>통계 공개</Text>
                            <Text style={styles.settingDescription}>
                                학습 통계를 다른 사용자에게 공개합니다
                            </Text>
                        </View>
                        <Switch
                            value={profile.privacySettings.showStats}
                            onValueChange={(value) =>
                                setProfile(prev => ({
                                    ...prev,
                                    privacySettings: {
                                        ...prev.privacySettings,
                                        showStats: value
                                    }
                                }))
                            }
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={profile.privacySettings.showStats
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>
                </View>
            </ScrollView>

            {/* 하단 버튼 */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        isSaving && styles.saveButtonDisabled
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>저장</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    coverImageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.background.secondary,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    coverImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverImageText: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
    },
    avatarContainer: {
        alignSelf: 'center',
        marginTop: -50,
        marginBottom: theme.spacing.lg,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: theme.colors.background.primary,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: theme.colors.background.primary,
    },
    avatarBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background.primary,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    inputContainer: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        padding: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    inputError: {
        borderWidth: 1,
        borderColor: theme.colors.status.error,
    },
    errorText: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.status.error,
        marginTop: theme.spacing.xs,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    tagInput: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    tagAddButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
    },
    tagAddButtonDisabled: {
        backgroundColor: theme.colors.grey[300],
    },
    tagAddButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary.main,
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 12,
        gap: 4,
    },
    tagText: {
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    settingLabel: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    settingText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    settingDescription: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    visibilityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
    },
    visibilityButtonText: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginRight: theme.spacing.xs,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginRight: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    saveButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: theme.colors.grey[300],
    },
    cancelButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    saveButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    }
});
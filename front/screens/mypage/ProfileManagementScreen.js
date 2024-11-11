// ProfileManagementScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Alert,
    Switch,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import FastImage from 'react-native-fast-image';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { API_URL } from '../../config/api';
import { updateProfile } from '../redux/slices/userSlice';
import { validatePassword, validateEmail } from '../utils/validators';
import { encryptData, decryptData } from '../utils/encryption';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 상수 정의
const PROFILE_IMAGE_SIZE = 120;
const BACKGROUND_IMAGE_HEIGHT = 200;
const INPUT_HEIGHT = 50;
const SOCIAL_BUTTONS = [
    { id: 'google', name: 'Google', icon: 'google', color: '#DB4437' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#4267B2' },
    { id: 'apple', name: 'Apple', icon: 'apple', color: '#000000' }
];

const ProfileManagementScreen = () => {
    // 상태 관리
    const [userInfo, setUserInfo] = useState({
        name: '',
        email: '',
        phone: '',
        profileImage: null,
        backgroundImage: null,
        isPublic: true
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [imageType, setImageType] = useState(null); // 'profile' or 'background'
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [socialAccounts, setSocialAccounts] = useState({
        google: false,
        facebook: false,
        apple: false
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showSocialModal, setShowSocialModal] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Refs
    const scrollViewRef = useRef(null);
    const nameInputRef = useRef(null);
    const emailInputRef = useRef(null);
    const phoneInputRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Navigation
    const navigation = useNavigation();

    // 초기화
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await loadUserProfile();
            await checkSocialAccounts();
            startEntryAnimation();
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '프로필 정보를 불러오는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        if (hasUnsavedChanges) {
            showUnsavedChangesAlert();
        }
    };
    // 데이터 로딩 및 처리 함수들
    const loadUserProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/profile`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUserInfo(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load user profile:', error);
            Alert.alert('오류', '프로필 정보를 불러오는데 실패했습니다.');
            setIsLoading(false);
        }
    };

    const checkSocialAccounts = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/profile/social-accounts`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSocialAccounts(response.data);
        } catch (error) {
            console.error('Failed to check social accounts:', error);
        }
    };

    const handleProfileUpdate = async (updatedInfo) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
                `${API_URL}/api/profile`,
                updatedInfo,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUserInfo(updatedInfo);
            dispatch(updateProfile(updatedInfo));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('성공', '프로필이 업데이트되었습니다.');
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
        }
    };

    const handlePasswordChange = async () => {
        try {
            if (passwordForm.new !== passwordForm.confirm) {
                Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
                return;
            }

            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
                `${API_URL}/api/profile/password`,
                {
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.new
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setShowPasswordModal(false);
            setPasswordForm({ current: '', new: '', confirm: '' });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('성공', '비밀번호가 변경되었습니다.');
        } catch (error) {
            console.error('Failed to change password:', error);
            Alert.alert('오류', '비밀번호 변경에 실패했습니다.');
        }
    };

    const handleSocialAccountLink = async (platform) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.post(
                `${API_URL}/api/profile/social-link/${platform}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSocialAccounts(prev => ({
                ...prev,
                [platform]: true
            }));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to link social account:', error);
            Alert.alert('오류', '소셜 계정 연동에 실패했습니다.');
        }
    };

    const handleSocialAccountUnlink = async (platform) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(
                `${API_URL}/api/profile/social-link/${platform}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSocialAccounts(prev => ({
                ...prev,
                [platform]: false
            }));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to unlink social account:', error);
            Alert.alert('오류', '소셜 계정 연동 해제에 실패했습니다.');
        }
    };

    const handleProfileImageUpdate = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const token = await AsyncStorage.getItem('userToken');
                const formData = new FormData();
                formData.append('image', {
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    name: 'profile_image.jpg'
                });

                await axios.put(
                    `${API_URL}/api/profile/image`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                setUserInfo(prev => ({
                    ...prev,
                    profileImage: result.assets[0].uri
                }));

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Failed to update profile image:', error);
            Alert.alert('오류', '프로필 이미지 업데이트에 실패했습니다.');
        }
    };

    const handleProfileReset = async () => {
        Alert.alert(
            '프로필 초기화',
            '프로필을 초기 설정으로 되돌리시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '초기화',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.post(
                                `${API_URL}/api/profile/reset`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            await loadUserProfile();
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('성공', '프로필이 초기화되었습니다.');
                        } catch (error) {
                            console.error('Failed to reset profile:', error);
                            Alert.alert('오류', '프로필 초기화에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };
    // 메인 렌더링
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 상단 프로필 섹션 */}
            <View style={styles.profileSection}>
                <TouchableOpacity
                    style={styles.profileImageContainer}
                    onPress={handleProfileImageUpdate}
                >
                    <FastImage
                        style={styles.profileImage}
                        source={{
                            uri: userInfo.profileImage,
                            priority: FastImage.priority.high
                        }}
                        defaultSource={require('../assets/default-profile.png')}
                    />
                    <View style={styles.editImageButton}>
                        <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>

                <View style={styles.nameContainer}>
                    {isEditing ? (
                        <TextInput
                            style={styles.nameInput}
                            value={userInfo.name}
                            onChangeText={(text) => setUserInfo(prev => ({ ...prev, name: text }))}
                            onBlur={handleProfileUpdate}
                            autoFocus
                        />
                    ) : (
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <Text style={styles.nameText}>{userInfo.name}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 설정 섹션 */}
            <ScrollView style={styles.settingsContainer}>
                {/* 기본 정보 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => handleEmailUpdate()}
                    >
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="email" size={24} color="#757575" />
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingLabel}>이메일</Text>
                                <Text style={styles.settingValue}>{userInfo.email}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => handlePhoneUpdate()}
                    >
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="phone" size={24} color="#757575" />
                            <View style={styles.settingTextContainer}>
                                <Text style={styles.settingLabel}>전화번호</Text>
                                <Text style={styles.settingValue}>{userInfo.phone}</Text>
                            </View>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>
                </View>

                {/* 보안 설정 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>보안</Text>
                    <TouchableOpacity
                        style={styles.settingItem}
                        onPress={() => setShowPasswordModal(true)}
                    >
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="lock" size={24} color="#757575" />
                            <Text style={styles.settingLabel}>비밀번호 변경</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="visibility" size={24} color="#757575" />
                            <Text style={styles.settingLabel}>프로필 공개 설정</Text>
                        </View>
                        <Switch
                            value={userInfo.isPublic}
                            onValueChange={(value) => handlePrivacyUpdate(value)}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={userInfo.isPublic ? '#2196F3' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* 계정 연동 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>계정 연동</Text>
                    {SOCIAL_BUTTONS.map(social => (
                        <TouchableOpacity
                            key={social.id}
                            style={styles.socialButton}
                            onPress={() => handleSocialLink(social.id)}
                        >
                            <View style={styles.settingLeft}>
                                <MaterialIcons name={social.icon} size={24} color={social.color} />
                                <Text style={styles.settingLabel}>{social.name} 연동</Text>
                            </View>
                            {socialAccounts[social.id] ? (
                                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                            ) : (
                                <MaterialIcons name="add-circle-outline" size={24} color="#757575" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 하단 버튼 */}
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleProfileReset}
                >
                    <Text style={styles.resetButtonText}>프로필 초기화</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* 비밀번호 변경 모달 */}
            <Modal
                isVisible={showPasswordModal}
                onBackdropPress={() => setShowPasswordModal(false)}
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>비밀번호 변경</Text>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="현재 비밀번호"
                        secureTextEntry
                        value={passwordForm.current}
                        onChangeText={(text) => setPasswordForm(prev => ({ ...prev, current: text }))}
                    />
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="새 비밀번호"
                        secureTextEntry
                        value={passwordForm.new}
                        onChangeText={(text) => setPasswordForm(prev => ({ ...prev, new: text }))}
                    />
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="새 비밀번호 확인"
                        secureTextEntry
                        value={passwordForm.confirm}
                        onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirm: text }))}
                    />
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handlePasswordChange}
                    >
                        <Text style={styles.modalButtonText}>변경하기</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* 로딩 인디케이터 */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    profileSection: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    editImageButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        marginTop: 8,
    },
    nameInput: {
        fontSize: 24,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
        textAlign: 'center',
    },
    nameText: {
        fontSize: 24,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
    },
    settingsContainer: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginTop: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'SFProText-Semibold',
        color: '#333333',
        marginLeft: 16,
        marginVertical: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingTextContainer: {
        marginLeft: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        marginLeft: 12,
    },
    settingValue: {
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#757575',
        marginTop: 2,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    resetButton: {
        marginTop: 24,
        marginBottom: 32,
        marginHorizontal: 16,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 16,
        fontFamily: 'SFProDisplay-Bold',
        color: '#FFFFFF',
    },
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'SFProDisplay-Bold',
        color: '#333333',
        marginBottom: 16,
    },
    passwordInput: {
        height: 50,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
        fontSize: 16,
    },
    modalButton: {
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    modalButtonText: {
        fontSize: 16,
        fontFamily: 'SFProDisplay-Bold',
        color: '#FFFFFF',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProfileManagementScreen;
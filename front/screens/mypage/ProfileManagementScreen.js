// ProfileManagementScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    Image,
    Switch,
    Platform,
    ActivityIndicator,
    Alert,
    Animated,
    TextInput,
    Modal,
    Dimensions,
    KeyboardAvoidingView,
    StatusBar,
    LayoutAnimation,
    UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';
import * as Crypto from 'expo-crypto';
import { manipulateAsync } from 'expo-image-manipulator';
import * as Notifications from 'expo-notifications';
import { debounce } from 'lodash';
import {API_URL} from '../../config/api'

// Android 애니메이션 활성화
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width, height } = Dimensions.get('window');

// API 엔드포인트 정의
const API_ENDPOINTS = {
    PROFILE: '/api/profile',
    UPLOAD: '/api/upload',
    PASSWORD: '/api/password',
    SOCIAL: '/api/social',
    SETTINGS: '/api/settings',
    PRIVACY: '/api/privacy',
    NOTIFICATIONS: '/api/notifications'
};

const ProfileManagementScreen = ({ navigation }) => {
    // 애니메이션 값
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [sectionLoading, setSectionLoading] = useState({});
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        profileImage: null,
        backgroundImage: null,
        isPublic: false,
        bio: '',
        location: '',
        website: '',
        socialAccounts: {
            google: false,
            facebook: false,
            twitter: false
        },
        settings: {
            emailNotifications: true,
            pushNotifications: true,
            twoFactorAuth: false,
            darkMode: false,
            language: 'ko',
            timezone: 'Asia/Seoul'
        },
        privacy: {
            profileVisibility: 'public',
            emailVisibility: 'private',
            phoneVisibility: 'private',
            activityVisibility: 'friends'
        }
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState(0);

    // 캐시 및 데이터 관리
    const dataCache = useRef({
        lastFetch: null,
        data: null
    });

    // 디바운스된 저장 함수
    const debouncedSave = useCallback(
        debounce((data) => {
            saveProfile(data);
        }, 1000),
        []
    );

    // 유틸리티 함수
    const handleError = (error, fallbackMessage) => {
        console.error('Error:', error);
        const message = error.response?.data?.message || fallbackMessage;
        Alert.alert('Error', message);
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const encryptData = async (data) => {
        try {
            const encryptionKey = await SecureStore.getItemAsync('encryptionKey');
            const jsonString = JSON.stringify(data);
            const digest = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                jsonString + encryptionKey
            );
            return { data, hash: digest };
        } catch (error) {
            handleError(error, 'Encryption failed');
            return null;
        }
    };

    const optimizeImage = async (uri, type) => {
        try {
            const result = await manipulateAsync(
                uri,
                [
                    {
                        resize: {
                            width: type === 'profile' ? 400 : 1200,
                            height: type === 'profile' ? 400 : 675
                        }
                    }
                ],
                { compress: 0.8, format: 'jpeg' }
            );
            return result.uri;
        } catch (error) {
            handleError(error, 'Image optimization failed');
            return uri;
        }
    };

    useEffect(() => {
        const setupScreen = async () => {
            await checkPermissions();
            await loadUserData();
            setupAnimations();
        };

        setupScreen();

        return () => {
            // Cleanup
            if (hasUnsavedChanges) {
                saveProfile(userData);
            }
        };
    }, []);

    useEffect(() => {
        const backHandler = navigation.addListener('beforeRemove', (e) => {
            if (!hasUnsavedChanges) return;

            e.preventDefault();
            Alert.alert(
                '저장되지 않은 변경사항',
                '변경사항을 저장하지 않고 나가시겠습니까?',
                [
                    { text: '취소', style: 'cancel', onPress: () => {} },
                    {
                        text: '나가기',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });

        return backHandler;
    }, [hasUnsavedChanges, navigation]);

    const setupAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const loadUserData = async () => {
        try {
            setLoading(true);
            // 캐시된 데이터 확인
            const cachedData = await AsyncStorage.getItem('userData');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                setUserData(parsed);

                // 캐시가 15분 이내라면 API 호출 스킵
                if (dataCache.current.lastFetch &&
                    Date.now() - dataCache.current.lastFetch < 15 * 60 * 1000) {
                    return;
                }
            }

            const token = await SecureStore.getItemAsync('userToken');
            const response = await axios.get(`${API_URL}${API_ENDPOINTS.PROFILE}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept-Language': userData.settings.language || 'ko'
                }
            });

            const decryptedData = await decryptData(response.data);
            setUserData(decryptedData);
            dataCache.current = {
                lastFetch: Date.now(),
                data: decryptedData
            };
            await AsyncStorage.setItem('userData', JSON.stringify(decryptedData));
        } catch (error) {
            handleError(error, '프로필 데이터를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async (data = userData) => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('userToken');
            const encryptedData = await encryptData(data);

            await axios.put(
                `${API_URL}${API_ENDPOINTS.PROFILE}`,
                encryptedData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            await AsyncStorage.setItem('userData', JSON.stringify(data));
            setHasUnsavedChanges(false);
            Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다');
        } catch (error) {
            handleError(error, '프로필 저장에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (type) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'profile' ? [1, 1] : [16, 9],
                quality: 1,
            });

            if (!result.canceled) {
                setModalVisible(false);
                setSectionLoading({ ...sectionLoading, [type]: true });

                const optimizedUri = await optimizeImage(result.assets[0].uri, type);
                const formData = new FormData();
                formData.append('image', {
                    uri: optimizedUri,
                    type: 'image/jpeg',
                    name: `${type}_${Date.now()}.jpg`,
                });

                const token = await SecureStore.getItemAsync('userToken');
                const response = await axios.post(
                    `${API_URL}${API_ENDPOINTS.UPLOAD}/${type}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`,
                        },
                        onUploadProgress: (progressEvent) => {
                            const progress =
                                (progressEvent.loaded / progressEvent.total) * 100;
                            setImageUploadProgress(progress);
                        },
                    }
                );

                setUserData(prev => ({
                    ...prev,
                    [`${type}Image`]: response.data.url
                }));
                setHasUnsavedChanges(true);
            }
        } catch (error) {
            handleError(error, '이미지 업로드에 실패했습니다');
        } finally {
            setSectionLoading({ ...sectionLoading, [type]: false });
            setImageUploadProgress(0);
        }
    };

    const renderHeader = () => (
        <Animated.View
            style={[
                styles.header,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <Text style={styles.headerTitle}>프로필 관리</Text>
            <View style={styles.headerButtons}>
                {hasUnsavedChanges && (
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => loadUserData()}
                    >
                        <MaterialIcons name="cancel" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => saveProfile()}
                    disabled={loading || !hasUnsavedChanges}
                >
                    {loading ? (
                        <ActivityIndicator color="#4A90E2" />
                    ) : (
                        <MaterialIcons
                            name="save"
                            size={24}
                            color={hasUnsavedChanges ? "#4A90E2" : "#CCCCCC"}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderProfileImage = () => (
        <Animated.View style={[styles.section, styles.profileImageSection]}>
            <Text style={styles.sectionTitle}>프로필 사진</Text>
            <TouchableOpacity
                onPress={() => {
                    setModalType('profile');
                    setModalVisible(true);
                }}
                style={styles.profileImageContainer}
            >
                {sectionLoading.profile ? (
                    <ActivityIndicator size="large" color="#4A90E2" />
                ) : (
                    <>
                        <Image
                            source={
                                userData.profileImage
                                    ? { uri: userData.profileImage }
                                    : require('../../assets/images/icons/user.png')
                            }
                            style={styles.profileImage}
                        />
                        <View style={styles.profileImageOverlay}>
                            <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                        </View>
                    </>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    const renderBasicInfo = () => (
        <Animated.View style={[styles.section, styles.basicInfoSection]}>
            <Text style={styles.sectionTitle}>기본 정보</Text>
            <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#757575" />
                <TextInput
                    style={styles.input}
                    value={userData.name}
                    onChangeText={(text) => {
                        setUserData(prev => ({ ...prev, name: text }));
                        setHasUnsavedChanges(true);
                    }}
                    placeholder="이름"
                    placeholderTextColor="#999999"
                />
            </View>
            <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#757575" />
                <TextInput
                    style={styles.input}
                    value={userData.email}
                    onChangeText={(text) => {
                        setUserData(prev => ({ ...prev, email: text }));
                        setHasUnsavedChanges(true);
                    }}
                    placeholder="이메일"
                    placeholderTextColor="#999999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>
            <View style={styles.inputContainer}>
                <MaterialIcons name="phone" size={20} color="#757575" />
                <TextInput
                    style={styles.input}
                    value={userData.phone}
                    onChangeText={(text) => {
                        setUserData(prev => ({ ...prev, phone: text }));
                        setHasUnsavedChanges(true);
                    }}
                    placeholder="전화번호"
                    placeholderTextColor="#999999"
                    keyboardType="phone-pad"
                />
            </View>
        </Animated.View>
    );

    const renderPasswordSection = () => (
        <Animated.View style={[styles.section, styles.passwordSection]}>
            <Text style={styles.sectionTitle}>비밀번호 변경</Text>
            <View style={styles.inputContainer}>
                <MaterialIcons name="lock" size={20} color="#757575" />
                <TextInput
                    style={styles.input}
                    value={passwords.current}
                    onChangeText={(text) => setPasswords(prev => ({ ...prev, current: text }))}
                    placeholder="현재 비밀번호"
                    placeholderTextColor="#999999"
                    secureTextEntry
                />
            </View>
            <View style={styles.inputContainer}>
                <MaterialIcons name="lock-outline" size={20} color="#757575" />
                <TextInput
                    style={styles.input}
                    value={passwords.new}
                    onChangeText={(text) => setPasswords(prev => ({ ...prev, new: text }))}
                    placeholder="새 비밀번호"
                    placeholderTextColor="#999999"
                    secureTextEntry
                />
            </View>
            <View style={styles.inputContainer}>
                <MaterialIcons name="lock-outline" size={20} color="#757575" />
                <TextInput
                    style={styles.input}
                    value={passwords.confirm}
                    onChangeText={(text) => setPasswords(prev => ({ ...prev, confirm: text }))}
                    placeholder="새 비밀번호 확인"
                    placeholderTextColor="#999999"
                    secureTextEntry
                />
            </View>
            {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
            )}
            <TouchableOpacity
                style={[
                    styles.button,
                    (!passwords.current || !passwords.new || !passwords.confirm) && styles.buttonDisabled
                ]}
                onPress={handlePasswordChange}
                disabled={!passwords.current || !passwords.new || !passwords.confirm}
            >
                <Text style={styles.buttonText}>비밀번호 변경</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderSocialAccounts = () => (
        <Animated.View style={[styles.section, styles.socialSection]}>
            <Text style={styles.sectionTitle}>계정 연동</Text>
            {Object.entries(userData.socialAccounts).map(([platform, isLinked]) => (
                <TouchableOpacity
                    key={platform}
                    style={[styles.socialButton, isLinked && styles.socialButtonLinked]}
                    onPress={() => handleSocialLink(platform)}
                >
                    <MaterialIcons
                        name={platform.toLowerCase()}
                        size={24}
                        color={isLinked ? '#FFFFFF' : '#757575'}
                    />
                    <Text style={[styles.socialText, isLinked && styles.socialTextLinked]}>
                        {isLinked ? `${platform} 연동됨` : `${platform} 연동하기`}
                    </Text>
                    {isLinked && (
                        <TouchableOpacity
                            style={styles.unlinkButton}
                            onPress={() => handleSocialUnlink(platform)}
                        >
                            <MaterialIcons name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            ))}
        </Animated.View>
    );

    const renderPrivacySettings = () => (
        <Animated.View style={[styles.section, styles.privacySection]}>
            <Text style={styles.sectionTitle}>프라이버시 설정</Text>
            <View style={styles.privacyOption}>
                <Text style={styles.privacyLabel}>프로필 공개</Text>
                <Switch
                    value={userData.isPublic}
                    onValueChange={(value) => {
                        setUserData(prev => ({ ...prev, isPublic: value }));
                        setHasUnsavedChanges(true);
                    }}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={userData.isPublic ? '#4A90E2' : '#f4f3f4'}
                />
            </View>
            <View style={styles.privacyOption}>
                <Text style={styles.privacyLabel}>이메일 공개</Text>
                <Switch
                    value={userData.privacy.emailVisibility === 'public'}
                    onValueChange={(value) => {
                        setUserData(prev => ({
                            ...prev,
                            privacy: {
                                ...prev.privacy,
                                emailVisibility: value ? 'public' : 'private'
                            }
                        }));
                        setHasUnsavedChanges(true);
                    }}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={userData.privacy.emailVisibility === 'public' ? '#4A90E2' : '#f4f3f4'}
                />
            </View>
        </Animated.View>
    );

    const renderBackgroundImage = () => (
        <Animated.View style={[styles.section, styles.backgroundSection]}>
            <Text style={styles.sectionTitle}>배경 이미지</Text>
            <TouchableOpacity
                onPress={() => {
                    setModalType('background');
                    setModalVisible(true);
                }}
                style={styles.backgroundImageContainer}
            >
                {sectionLoading.background ? (
                    <ActivityIndicator size="large" color="#4A90E2" />
                ) : (
                    <>
                        <Image
                            source={
                                userData.backgroundImage
                                    ? { uri: userData.backgroundImage }
                                    : require('./assets/default-background.png')
                            }
                            style={styles.backgroundImage}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
                            style={styles.backgroundGradient}
                        >
                            <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                        </LinearGradient>
                    </>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    const renderImagePickerModal = () => (
        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
        >
            <BlurView
                style={styles.modalContainer}
                intensity={100}
                tint="dark"
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        {modalType === 'profile' ? '프로필 사진 변경' : '배경 이미지 변경'}
                    </Text>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => handleImageUpload(modalType)}
                    >
                        <MaterialIcons name="photo-library" size={24} color="#4A90E2" />
                        <Text style={styles.modalButtonText}>갤러리에서 선택</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <MaterialIcons name="close" size={24} color="#FF3B30" />
                        <Text style={[styles.modalButtonText, { color: '#FF3B30' }]}>취소</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Modal>
    );

    // 메인 렌더링
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {renderHeader()}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {renderProfileImage()}
                    {renderBasicInfo()}
                    {renderPasswordSection()}
                    {renderSocialAccounts()}
                    {renderPrivacySettings()}
                    {renderBackgroundImage()}
                    <View style={styles.bottomButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.resetButton]}
                            onPress={handleResetProfile}
                        >
                            <Text style={[styles.buttonText, styles.resetButtonText]}>
                                프로필 초기화
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderImagePickerModal()}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto',
        fontWeight: 'bold',
        color: '#333333',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    section: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 16,
    },
    // 프로필 이미지 관련 스타일
    profileImageSection: {
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        marginVertical: 16,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    profileImageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    // 입력 필드 관련 스타일
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        height: 48,
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#333333',
    },
    // 비밀번호 섹션 스타일
    passwordSection: {
        backgroundColor: '#FFF3E0',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginBottom: 8,
    },
    // 소셜 계정 섹션 스타일
    socialSection: {
        backgroundColor: '#E1F5FE',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    socialButtonLinked: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    socialText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#333333',
        flex: 1,
    },
    socialTextLinked: {
        color: '#FFFFFF',
    },
    unlinkButton: {
        padding: 4,
    },
    // 프라이버시 섹션 스타일
    privacySection: {
        backgroundColor: '#F0F4C3',
    },
    privacyOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    privacyLabel: {
        fontSize: 14,
        color: '#333333',
    },
    // 배경 이미지 섹션 스타일
    backgroundSection: {
        backgroundColor: '#F8F8F8',
    },
    backgroundImageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#EEEEEE',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 버튼 스타일
    button: {
        height: 48,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resetButton: {
        backgroundColor: '#FF3B30',
    },
    resetButtonText: {
        color: '#FFFFFF',
    },
    // 모달 스타일
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#F8F8F8',
    },
    modalButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#333333',
    },
    // 로딩 오버레이 스타일
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // 이미지 업로드 프로그레스 스타일
    uploadProgress: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#4A90E2',
    },
    // 하단 버튼 컨테이너
    bottomButtons: {
        padding: 16,
    },
});

export default ProfileManagementScreen;
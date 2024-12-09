import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Platform,
    ScrollView,
    TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../styles/theme';
import api from '../../../api/api';

const ImagePickerButton = memo(({ onPress, children }) => (
    <TouchableOpacity
        onPress={onPress}
        style={styles.imagePickerButton}
        activeOpacity={0.8}
    >
        {children}
        <View style={styles.editIcon}>
            <Icon name="edit-2" size={20} color={theme.colors.white} />
        </View>
    </TouchableOpacity>
));

const EditProfileScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        backgroundImage: null,
        profileImage: null,
        name: '',
        bio: '',
        email: ''
    });

    const fetchProfileData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/profile');
            setProfileData(response.data);
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '프로필을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProfileData();
            return () => {
                setProfileData({
                    backgroundImage: null,
                    profileImage: null,
                    name: '',
                    bio: '',
                    email: ''
                });
            };
        }, [fetchProfileData])
    );

    const pickImage = useCallback(async (type) => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        };

        try {
            const result = await launchImageLibrary(options);
            if (!result.didCancel && result.assets) {
                const imageUri = result.assets[0].uri;
                const formData = new FormData();
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const fileType = match ? `image/${match[1]}` : 'image';

                formData.append('image', {
                    uri: imageUri,
                    type: fileType,
                    name: filename
                });

                setLoading(true);
                const response = await api.post(`/profile/image/${type}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                setProfileData(prev => ({
                    ...prev,
                    [type === 'background' ? 'backgroundImage' : 'profileImage']: response.data.imageUrl
                }));
            }
        } catch (error) {
            Alert.alert('오류', '이미지 업로드에 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSave = useCallback(async () => {
        try {
            setLoading(true);
            await api.put('/profile', profileData);
            Alert.alert('성공', '프로필이 업데이트되었습니다', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '프로필 업데이트에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [profileData, navigation]);

    const handleInputChange = useCallback((field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    if (loading && !profileData.name) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="x" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>프로필 편집</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                        저장
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.editSection}>
                    <ImagePickerButton onPress={() => pickImage('background')}>
                        <Image
                            source={profileData.backgroundImage ?
                                { uri: profileData.backgroundImage } :
                                require('../../../assets/default-background.png')
                            }
                            style={styles.backgroundImage}
                        />
                    </ImagePickerButton>

                    <ImagePickerButton onPress={() => pickImage('profile')}>
                        <Image
                            source={profileData.profileImage ?
                                { uri: profileData.profileImage } :
                                require('../../../assets/default-profile.png')
                            }
                            style={styles.profileImage}
                        />
                    </ImagePickerButton>

                    <View style={styles.inputSection}>
                        <TextInput
                            style={styles.input}
                            placeholder="이름"
                            value={profileData.name}
                            onChangeText={(value) => handleInputChange('name', value)}
                            placeholderTextColor={theme.colors.textTertiary}
                        />
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="자기소개"
                            value={profileData.bio}
                            onChangeText={(value) => handleInputChange('bio', value)}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor={theme.colors.textTertiary}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="이메일"
                            value={profileData.email}
                            onChangeText={(value) => handleInputChange('email', value)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={theme.colors.textTertiary}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    saveButton: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        color: theme.colors.disabled,
    },
    content: {
        flex: 1,
    },
    editSection: {
        alignItems: 'center',
    },
    imagePickerButton: {
        position: 'relative',
    },
    backgroundImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginTop: -50,
        borderWidth: 3,
        borderColor: theme.colors.background,
    },
    editIcon: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputSection: {
        width: '100%',
        padding: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.small,
        marginBottom: theme.spacing.sm,
        fontSize: 16,
        color: theme.colors.text,
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
    }
});

export default memo(EditProfileScreen);
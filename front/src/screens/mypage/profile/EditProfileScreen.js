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
    ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { userAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

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
        bio: ''
    });

    const fetchProfileData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            if (response.data.success) {
                setProfileData(response.data.profile);
            }
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
                    bio: ''
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
                try {
                    const response = await userAPI.uploadImage(type, formData);
                    if (response.data.success) {
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
            }
        } catch (error) {
            Alert.alert('오류', '이미지 선택에 실패했습니다');
        }
    }, []);

    const handleSave = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userAPI.updateProfile(profileData);
            if (response.data.success) {
                Alert.alert('성공', '프로필이 업데이트되었습니다', [
                    {
                        text: '확인',
                        onPress: () => navigation.goBack()
                    }
                ]);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '프로필 업데이트에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [profileData, navigation]);

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
                    <Text style={[
                        styles.saveButton,
                        loading && styles.saveButtonDisabled
                    ]}>
                        저장
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.editSection}>
                    <ImagePickerButton onPress={() => pickImage('background')}>
                        <Image
                            source={
                                profileData.backgroundImage
                                    ? { uri: profileData.backgroundImage }
                                    : require('../../../../assets/default-profile.png')
                            }
                            style={styles.backgroundImage}
                        />
                    </ImagePickerButton>

                    <ImagePickerButton onPress={() => pickImage('profile')}>
                        <Image
                            source={
                                profileData.profileImage
                                    ? { uri: profileData.profileImage }
                                    : require('../../../../assets/default-profile.png')
                            }
                            style={styles.profileImage}
                        />
                    </ImagePickerButton>
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
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    saveButton: {
        ...theme.typography.bodyLarge,
        color: theme.colors.primary,
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
        backgroundColor: theme.colors.surface,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginTop: -50,
        borderWidth: 3,
        borderColor: theme.colors.background,
        backgroundColor: theme.colors.surface,
    },
    editIcon: {
        position: 'absolute',
        right: theme.spacing.sm,
        bottom: theme.spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: theme.roundness.full,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

EditProfileScreen.displayName = 'EditProfileScreen';

export default memo(EditProfileScreen);
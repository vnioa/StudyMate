import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { userAPI } from '../../services/api';

const EditProfileScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        backgroundImage: null,
        profileImage: null,
        name: '',
        bio: ''
    });

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            setProfileData(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '프로필을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async (type) => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        };

        try {
            const result = await launchImageLibrary(options);

            if (!result.didCancel && result.assets) {
                const imageUri = result.assets[0].uri;

                // 이미지 업로드 FormData 생성
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
                    setProfileData(prev => ({
                        ...prev,
                        [type === 'background' ? 'backgroundImage' : 'profileImage']: response.data.imageUrl
                    }));
                } catch (error) {
                    Alert.alert('오류', '이미지 업로드에 실패했습니다.');
                } finally {
                    setLoading(false);
                }
            }
        } catch (error) {
            Alert.alert('오류', '이미지 선택에 실패했습니다.');
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await userAPI.updateProfile(profileData);
            Alert.alert('성공', '프로필이 업데이트되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '프로필 업데이트에 실패했습니다.');
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
                    <Icon name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>프로필 편집</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveButton}>저장</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
                <TouchableOpacity
                    style={styles.backgroundContainer}
                    onPress={() => pickImage('background')}
                >
                    <Image
                        source={
                            profileData.backgroundImage
                                ? { uri: profileData.backgroundImage }
                                : require('../../../assets/images/default-background.jpg')
                        }
                        style={styles.backgroundImage}
                    />
                    <View style={styles.editIcon}>
                        <Icon name="edit-2" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.profileImageContainer}
                    onPress={() => pickImage('profile')}
                >
                    <Image
                        source={
                            profileData.profileImage
                                ? { uri: profileData.profileImage }
                                : require('../../../assets/images/default-profile.jpg')
                        }
                        style={styles.profileImage}
                    />
                    <View style={styles.editIcon}>
                        <Icon name="edit-2" size={20} color="#fff" />
                    </View>
                </TouchableOpacity>
            </View>
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
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        color: '#0066FF',
        fontSize: 16,
        fontWeight: '600',
    },
    editSection: {
        alignItems: 'center',
    },
    backgroundContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
        backgroundColor: '#f0f0f0',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    profileImageContainer: {
        marginTop: -50,
        borderWidth: 3,
        borderColor: '#fff',
        borderRadius: 75,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f0f0f0',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
});

export default EditProfileScreen;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { userAPI } from '../../services/api';

const ProfileScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [userProfile, setUserProfile] = useState({
        name: '',
        email: '',
        profileImage: null,
        backgroundImage: null,
        isPublic: true,
        connectedAccounts: []
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            setUserProfile(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '프로필을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (type) => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'profile' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                const formData = new FormData();
                const imageUri = result.assets[0].uri;
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image';

                formData.append('image', {
                    uri: imageUri,
                    name: filename,
                    type
                });

                const response = await userAPI.uploadImage(type, formData);
                setUserProfile(prev => ({
                    ...prev,
                    [type === 'profile' ? 'profileImage' : 'backgroundImage']: response.data.imageUrl
                }));
            }
        } catch (error) {
            Alert.alert('오류', '이미지 업로드에 실패했습니다.');
        }
    };

    const handlePasswordChange = () => {
        navigation.navigate('ChangePassword');
    };

    const toggleProfileVisibility = async () => {
        try {
            await userAPI.updatePrivacy({ isPublic: !userProfile.isPublic });
            setUserProfile(prev => ({ ...prev, isPublic: !prev.isPublic }));
        } catch (error) {
            Alert.alert('오류', '프로필 공개 설정 변경에 실패했습니다.');
        }
    };

    const handleDisconnectAccount = async (accountId) => {
        try {
            await userAPI.disconnectAccount(accountId);
            setUserProfile(prev => ({
                ...prev,
                connectedAccounts: prev.connectedAccounts.filter(acc => acc.id !== accountId)
            }));
            Alert.alert('성공', '계정 연동이 해제되었습니다.');
        } catch (error) {
            Alert.alert('오류', '계정 연동 해제에 실패했습니다.');
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchUserProfile}
                />
            }
        >
            <TouchableOpacity
                style={styles.backgroundImageContainer}
                onPress={() => handleImageUpload('background')}
            >
                <Image
                    source={userProfile.backgroundImage ?
                        { uri: userProfile.backgroundImage } :
                        require('../../../assets/default-background.jpg')}
                    style={styles.backgroundImage}
                />
                <View style={styles.backgroundImageOverlay}>
                    <Ionicons name="camera" size={24} color="white" />
                </View>
            </TouchableOpacity>

            <View style={styles.profileSection}>
                <TouchableOpacity
                    style={styles.profileImageContainer}
                    onPress={() => handleImageUpload('profile')}
                >
                    <Image
                        source={userProfile.profileImage ?
                            { uri: userProfile.profileImage } :
                            require('../../../assets/default-profile.png')}
                        style={styles.profileImage}
                    />
                    <View style={styles.profileImageOverlay}>
                        <Ionicons name="camera" size={20} color="white" />
                    </View>
                </TouchableOpacity>

                <Text style={styles.userName}>{userProfile.name}</Text>
                <Text style={styles.userEmail}>{userProfile.email}</Text>
            </View>

            <View style={styles.settingsSection}>
                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={handlePasswordChange}
                >
                    <Text style={styles.settingText}>비밀번호 변경</Text>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>

                <View style={styles.settingItem}>
                    <Text style={styles.settingText}>프로필 공개 설정</Text>
                    <Switch
                        value={userProfile.isPublic}
                        onValueChange={toggleProfileVisibility}
                    />
                </View>

                <View style={styles.connectedAccountsSection}>
                    <Text style={styles.sectionTitle}>연동된 계정</Text>
                    {userProfile.connectedAccounts.map((account) => (
                        <View key={account.id} style={styles.accountItem}>
                            <Text>{account.provider}</Text>
                            <TouchableOpacity
                                onPress={() => handleDisconnectAccount(account.id)}
                            >
                                <Text style={styles.disconnectText}>연동 해제</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backgroundImageContainer: {
        height: 200,
        width: '100%',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    backgroundImageOverlay: {
        position: 'absolute',
        right: 15,
        bottom: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: -50,
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    profileImageOverlay: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 6,
        borderRadius: 15,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    settingsSection: {
        padding: 20,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingText: {
        fontSize: 16,
    },
    connectedAccountsSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    disconnectText: {
        color: '#ff3b30',
    },
});

export default ProfileScreen;
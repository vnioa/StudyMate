import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    Alert,
    RefreshControl,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { userAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const SettingItem = memo(({ title, rightElement, onPress }) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
    >
        <Text style={styles.settingText}>{title}</Text>
        {rightElement}
    </TouchableOpacity>
));

const ConnectedAccount = memo(({ account, onDisconnect }) => (
    <View style={styles.accountItem}>
        <Text style={styles.accountProvider}>{account.provider}</Text>
        <TouchableOpacity onPress={() => onDisconnect(account.id)}>
            <Text style={styles.disconnectText}>연동 해제</Text>
        </TouchableOpacity>
    </View>
));

const ProfileScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userProfile, setUserProfile] = useState({
        name: '',
        email: '',
        profileImage: null,
        backgroundImage: null,
        isPublic: true,
        connectedAccounts: []
    });

    const fetchUserProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            if (response.data.success) {
                setUserProfile(response.data.profile);
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
            fetchUserProfile();
            return () => {
                setUserProfile({
                    name: '',
                    email: '',
                    profileImage: null,
                    backgroundImage: null,
                    isPublic: true,
                    connectedAccounts: []
                });
            };
        }, [fetchUserProfile])
    );

    const handleImageUpload = useCallback(async (type) => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'profile' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets) {
                const formData = new FormData();
                const imageUri = result.assets[0].uri;
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const fileType = match ? `image/${match[1]}` : 'image';

                formData.append('image', {
                    uri: imageUri,
                    name: filename,
                    type: fileType
                });

                const response = await userAPI.uploadImage(type, formData);
                if (response.data.success) {
                    setUserProfile(prev => ({
                        ...prev,
                        [type === 'profile' ? 'profileImage' : 'backgroundImage']: response.data.imageUrl
                    }));
                }
            }
        } catch (error) {
            Alert.alert('오류', '이미지 업로드에 실패했습니다');
        }
    }, []);

    const handlePasswordChange = useCallback(() => {
        navigation.navigate('ChangePassword');
    }, [navigation]);

    const toggleProfileVisibility = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userAPI.updatePrivacy({
                isPublic: !userProfile.isPublic
            });
            if (response.data.success) {
                setUserProfile(prev => ({
                    ...prev,
                    isPublic: !prev.isPublic
                }));
            }
        } catch (error) {
            Alert.alert('오류', '프로필 공개 설정 변경에 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [userProfile.isPublic]);

    const handleDisconnectAccount = useCallback(async (accountId) => {
        try {
            setLoading(true);
            const response = await userAPI.disconnectAccount(accountId);
            if (response.data.success) {
                setUserProfile(prev => ({
                    ...prev,
                    connectedAccounts: prev.connectedAccounts.filter(acc => acc.id !== accountId)
                }));
                Alert.alert('성공', '계정 연동이 해제되었습니다');
            }
        } catch (error) {
            Alert.alert('오류', '계정 연동 해제에 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUserProfile();
        setRefreshing(false);
    }, [fetchUserProfile]);

    if (loading && !userProfile.email) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                />
            }
        >
            <TouchableOpacity
                style={styles.backgroundImageContainer}
                onPress={() => handleImageUpload('background')}
            >
                <Image
                    source={
                        userProfile.backgroundImage
                            ? { uri: userProfile.backgroundImage }
                            : require('../../../../assets/default-profile.png')
                    }
                    style={styles.backgroundImage}
                />
                <View style={styles.backgroundImageOverlay}>
                    <Ionicons
                        name="camera"
                        size={24}
                        color={theme.colors.white}
                    />
                </View>
            </TouchableOpacity>

            <View style={styles.profileSection}>
                <TouchableOpacity
                    style={styles.profileImageContainer}
                    onPress={() => handleImageUpload('profile')}
                >
                    <Image
                        source={
                            userProfile.profileImage
                                ? { uri: userProfile.profileImage }
                                : require('../../../../assets/default-profile.png')
                        }
                        style={styles.profileImage}
                    />
                    <View style={styles.profileImageOverlay}>
                        <Ionicons
                            name="camera"
                            size={20}
                            color={theme.colors.white}
                        />
                    </View>
                </TouchableOpacity>
                <Text style={styles.userName}>{userProfile.name}</Text>
                <Text style={styles.userEmail}>{userProfile.email}</Text>
            </View>

            <View style={styles.settingsSection}>
                <SettingItem
                    title="프로필 정보 수정"
                    onPress={() => navigation.navigate('EditInfo')}
                    rightElement={
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={theme.colors.textSecondary}
                        />
                    }
                />
                <SettingItem
                    title="상세 설정"
                    onPress={() => navigation.navigate('Settings')}
                    rightElement={
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={theme.colors.textSecondary}
                        />
                    }
                />
                <SettingItem
                    title="비밀번호 변경"
                    onPress={handlePasswordChange}
                    rightElement={
                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color={theme.colors.textSecondary}
                        />
                    }
                />
                <SettingItem
                    title="프로필 공개 설정"
                    rightElement={
                        <Switch
                            value={userProfile.isPublic}
                            onValueChange={toggleProfileVisibility}
                            trackColor={{
                                false: theme.colors.inactive,
                                true: theme.colors.primary
                            }}
                        />
                    }
                />

                <View style={styles.connectedAccountsSection}>
                    <Text style={styles.sectionTitle}>연동된 계정</Text>
                    {userProfile.connectedAccounts.map((account) => (
                        <ConnectedAccount
                            key={account.id}
                            account={account}
                            onDisconnect={handleDisconnectAccount}
                        />
                    ))}
                </View>
            </View>
        </ScrollView>
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
        right: theme.spacing.md,
        bottom: theme.spacing.md,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.full,
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
        borderColor: theme.colors.background,
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
        padding: theme.spacing.xs,
        borderRadius: theme.roundness.full,
    },
    userName: {
        ...theme.typography.headlineMedium,
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
    },
    userEmail: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    settingsSection: {
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    settingText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    connectedAccountsSection: {
        marginTop: theme.spacing.lg,
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.lg,
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    accountProvider: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    disconnectText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.error,
    }
});

ProfileScreen.displayName = 'ProfileScreen';

export default memo(ProfileScreen);
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../styles/theme';
import api from '../../api/api';

const CreateGroupScreen = ({ navigation }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [error, setError] = useState('');
    const [image, setImage] = useState(null);
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

    const checkGroupName = async () => {
        if (!groupName.trim()) {
            setError('그룹 이름을 입력해주세요.');
            return;
        }

        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.post('/api/groups/check-name', {
                groupName: groupName.trim()
            });

            if (response.data.success) {
                setError('');
                Alert.alert('확인 완료', '사용 가능한 그룹 이름입니다.');
            }
        } catch (error) {
            setError(error.response?.data?.message || '그룹 이름이 이미 존재합니다.');
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async () => {
        if (!image) return null;

        const formData = new FormData();
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('image', {
            uri: Platform.OS === 'ios' ? image.replace('file://', '') : image,
            name: filename,
            type
        });

        try {
            const response = await api.post('/api/groups/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data.imageUrl;
        } catch (error) {
            throw new Error('이미지 업로드에 실패했습니다.');
        }
    };

    const createGroup = async () => {
        if (!groupName.trim() || !groupDescription.trim()) {
            Alert.alert('오류', '모든 필드를 입력해주세요.');
            return;
        }

        if (error) {
            Alert.alert('오류', '그룹 이름을 확인하세요.');
            return;
        }

        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const imageUrl = await uploadImage();

            const response = await api.post('/api/groups', {
                name: groupName.trim(),
                description: groupDescription.trim(),
                imageUrl
            });

            if (response.data.success) {
                Alert.alert('성공', '그룹이 성공적으로 생성되었습니다!', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '그룹 생성에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('오류', '이미지 선택에 실패했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 생성</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.inputSquare}>
                    <TextInput
                        style={[
                            styles.input,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="그룹 이름"
                        value={groupName}
                        onChangeText={setGroupName}
                        editable={!loading && isOnline}
                        maxLength={30}
                    />
                    <TouchableOpacity
                        onPress={checkGroupName}
                        style={[
                            styles.actionButton,
                            (loading || !isOnline) && styles.buttonDisabled
                        ]}
                        disabled={loading || !isOnline}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={theme.colors.white} />
                        ) : (
                            <Text style={styles.actionButtonText}>확인</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.inputSquare}>
                    <TextInput
                        style={[
                            styles.input,
                            !isOnline && styles.inputDisabled
                        ]}
                        placeholder="그룹 설명"
                        value={groupDescription}
                        onChangeText={setGroupDescription}
                        editable={!loading && isOnline}
                        maxLength={100}
                    />
                    <TouchableOpacity
                        onPress={pickImage}
                        style={[
                            styles.actionButton,
                            (loading || !isOnline) && styles.buttonDisabled
                        ]}
                        disabled={loading || !isOnline}
                    >
                        {image ? (
                            <Image source={{ uri: image }} style={styles.image} />
                        ) : (
                            <Text style={styles.actionButtonText}>이미지</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.createButton,
                        (loading || !isOnline) && styles.buttonDisabled
                    ]}
                    onPress={createGroup}
                    disabled={loading || !isOnline}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                        <Text style={styles.createButtonText}>그룹 생성</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
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
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    iconButton: {
        padding: theme.spacing.sm,
    },
    title: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    inputSquare: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    input: {
        flex: 1,
        height: 48,
        paddingHorizontal: theme.spacing.md,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    actionButton: {
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        height: 48,
        width: 80,
        borderRadius: theme.roundness.medium,
        marginRight: theme.spacing.xs,
    },
    actionButtonText: {
        color: theme.colors.white,
        ...theme.typography.bodyMedium,
        fontWeight: '600',
    },
    errorText: {
        color: theme.colors.error,
        ...theme.typography.bodySmall,
        marginBottom: theme.spacing.sm,
    },
    image: {
        height: 48,
        width: 80,
        borderRadius: theme.roundness.medium,
    },
    createButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.large,
        alignItems: 'center',
        marginTop: theme.spacing.xl,
        ...Platform.select({
            ios: theme.shadows.medium,
            android: { elevation: 3 }
        }),
    },
    createButtonText: {
        color: theme.colors.white,
        ...theme.typography.bodyLarge,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
        opacity: 0.5,
    }
});

export default CreateGroupScreen;
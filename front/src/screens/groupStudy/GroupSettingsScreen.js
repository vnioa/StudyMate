import React, {useState, useCallback, memo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
    Alert,
    Modal,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://121.127.165.43:3000';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

const GroupSettingsScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        memberLimit: 'No Limit',
        category: '',
        goals: [],
        rules: [],
        iconImage: null,
        bannerImage: null
    });
    const [modalVisible, setModalVisible] = useState(false);
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

    const fetchSettings = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedSettings = await AsyncStorage.getItem(`groupSettings_${groupId}`);
            if (cachedSettings) {
                setSettings(JSON.parse(cachedSettings));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/groups/${groupId}/settings`);
            if (response.data.success) {
                setSettings(response.data.settings);
                await AsyncStorage.setItem(
                    `groupSettings_${groupId}`,
                    JSON.stringify(response.data.settings)
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '설정을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchSettings();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setSettings({
                    memberLimit: 'No Limit',
                    category: '',
                    goals: [],
                    rules: [],
                    iconImage: null,
                    bannerImage: null
                });
            };
        }, [fetchSettings])
    );

    const handleLimitChange = async (value) => {
        if (!(await checkNetwork())) return;

        try {
            const response = await api.put(`/api/groups/${groupId}/settings/member-limit`, {
                memberLimit: value
            });

            if (response.data.success) {
                setSettings(prev => ({ ...prev, memberLimit: value }));
                await AsyncStorage.setItem(
                    `groupSettings_${groupId}`,
                    JSON.stringify({ ...settings, memberLimit: value })
                );
                setModalVisible(false);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '인원 제한 설정에 실패했습니다'
            );
        }
    };

    const selectImage = async (type) => {
        if (!(await checkNetwork())) return;

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
                const formData = new FormData();
                const filename = result.assets[0].uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image';

                formData.append('image', {
                    uri: Platform.OS === 'ios' ? result.assets[0].uri.replace('file://', '') : result.assets[0].uri,
                    name: filename,
                    type
                });

                const response = await api.post(
                    `/api/groups/${groupId}/settings/${type}-image`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                if (response.data.success) {
                    setSettings(prev => ({
                        ...prev,
                        [type === 'icon' ? 'iconImage' : 'bannerImage']: response.data.imageUrl
                    }));
                    await AsyncStorage.setItem(
                        `groupSettings_${groupId}`,
                        JSON.stringify({
                            ...settings,
                            [type === 'icon' ? 'iconImage' : 'bannerImage']: response.data.imageUrl
                        })
                    );
                }
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '이미지 업로드에 실패했습니다'
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>그룹 설정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>카테고리</Text>
                    <View style={styles.categoryContainer}>
                        {['교육 및 학습', '사회 및 인간관계', '생활 및 취미', '여행 및 문화', '경제 및 재정']
                            .map((category, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.categoryItem,
                                        settings.category === category && styles.selectedCategory,
                                        !isOnline && styles.itemDisabled
                                    ]}
                                    onPress={async () => {
                                        if (!isOnline) return;
                                        try {
                                            const response = await api.put(
                                                `/api/groups/${groupId}/settings/category`,
                                                { category }
                                            );
                                            if (response.data.success) {
                                                setSettings(prev => ({ ...prev, category }));
                                            }
                                        } catch (error) {
                                            Alert.alert('오류', '카테고리 설정에 실패했습니다');
                                        }
                                    }}
                                    disabled={!isOnline}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        settings.category === category && styles.selectedCategoryText,
                                        !isOnline && styles.textDisabled
                                    ]}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        }
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>목표 설정</Text>
                    {settings.goals.map((goal, index) => (
                        <View key={index} style={styles.goalItem}>
                            <View style={styles.goalInfo}>
                                <Text style={[
                                    styles.goalTitle,
                                    !isOnline && styles.textDisabled
                                ]}>{goal.title}</Text>
                                <Text style={[
                                    styles.goalDescription,
                                    !isOnline && styles.textDisabled
                                ]}>{goal.description}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={async () => {
                                    if (!isOnline) return;
                                    try {
                                        const response = await api.delete(
                                            `/api/groups/${groupId}/settings/goals/${goal.id}`
                                        );
                                        if (response.data.success) {
                                            setSettings(prev => ({
                                                ...prev,
                                                goals: prev.goals.filter(g => g.id !== goal.id)
                                            }));
                                        }
                                    } catch (error) {
                                        Alert.alert('오류', '목표 삭제에 실패했습니다');
                                    }
                                }}
                                disabled={!isOnline}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={24}
                                    color={isOnline ? theme.colors.error : theme.colors.textDisabled}
                                />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            !isOnline && styles.buttonDisabled
                        ]}
                        onPress={() => navigation.navigate('AddGroupGoal', {
                            groupId,
                            onGoalAdded: fetchSettings
                        })}
                        disabled={!isOnline}
                    >
                        <Ionicons
                            name="add"
                            size={24}
                            color={isOnline ? theme.colors.white : theme.colors.textDisabled}
                        />
                        <Text style={[
                            styles.addButtonText,
                            !isOnline && styles.textDisabled
                        ]}>새 목표 추가</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.section,
                        !isOnline && styles.sectionDisabled
                    ]}
                    onPress={() => setModalVisible(true)}
                    disabled={!isOnline}
                >
                    <Text style={styles.sectionTitle}>인원 제한</Text>
                    <View style={styles.row}>
                        <Text style={[
                            styles.text,
                            !isOnline && styles.textDisabled
                        ]}>{settings.memberLimit}</Text>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={isOnline ? theme.colors.textSecondary : theme.colors.textDisabled}
                        />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.section,
                        !isOnline && styles.sectionDisabled
                    ]}
                    onPress={() => selectImage('icon')}
                    disabled={!isOnline}
                >
                    <Text style={styles.sectionTitle}>아이콘 설정</Text>
                    {settings.iconImage && (
                        <Image
                            source={{ uri: settings.iconImage }}
                            style={styles.imagePreview}
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.section,
                        !isOnline && styles.sectionDisabled
                    ]}
                    onPress={() => selectImage('banner')}
                    disabled={!isOnline}
                >
                    <Text style={styles.sectionTitle}>배너 이미지 설정</Text>
                    {settings.bannerImage && (
                        <Image
                            source={{ uri: settings.bannerImage }}
                            style={styles.imagePreview}
                        />
                    )}
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>그룹 규칙</Text>
                    {settings.rules.map((rule, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.ruleText,
                                !isOnline && styles.textDisabled
                            ]}
                        >
                            • {rule}
                        </Text>
                    ))}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>인원 제한 설정</Text>
                        <Picker
                            selectedValue={settings.memberLimit}
                            onValueChange={handleLimitChange}
                            style={styles.picker}
                        >
                            <Picker.Item label="제한 없음" value="No Limit" />
                            <Picker.Item label="10명" value="10" />
                            <Picker.Item label="20명" value="20" />
                            <Picker.Item label="50명" value="50" />
                            <Picker.Item label="100명" value="100" />
                        </Picker>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>인원 제한 설정</Text>
                        <Picker
                            selectedValue={settings.memberLimit}
                            onValueChange={handleLimitChange}
                            style={styles.picker}
                        >
                            <Picker.Item label="제한 없음" value="No Limit" />
                            <Picker.Item label="10명" value="10" />
                            <Picker.Item label="20명" value="20" />
                            <Picker.Item label="50명" value="50" />
                            <Picker.Item label="100명" value="100" />
                        </Picker>
                        <TouchableOpacity
                            style={[
                                styles.closeButton,
                                !isOnline && styles.buttonDisabled
                            ]}
                            onPress={() => setModalVisible(false)}
                            disabled={!isOnline}
                        >
                            <Text style={[
                                styles.closeButtonText,
                                !isOnline && styles.textDisabled
                            ]}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
    headerTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
    },
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    section: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.md,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    sectionTitle: {
        ...theme.typography.titleLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    categoryItem: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.sm,
        borderRadius: theme.roundness.large,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    selectedCategory: {
        backgroundColor: theme.colors.primary,
    },
    categoryText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
    },
    selectedCategoryText: {
        color: theme.colors.white,
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    goalInfo: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    goalTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    goalDescription: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    text: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: theme.roundness.medium,
        marginTop: theme.spacing.sm,
    },
    ruleText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.large,
        padding: theme.spacing.lg,
        ...Platform.select({
            ios: theme.shadows.large,
            android: { elevation: 5 }
        }),
    },
    modalTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    picker: {
        width: '100%',
    },
    closeButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    closeButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    addButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: theme.colors.disabled,
        opacity: 0.5,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    itemDisabled: {
        opacity: 0.5,
    },
    sectionDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    }
});

GroupSettingsScreen.displayName = 'GroupSettingsScreen';

export default memo(GroupSettingsScreen);
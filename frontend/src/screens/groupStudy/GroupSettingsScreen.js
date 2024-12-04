import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Modal,
    TextInput,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const SettingItem = memo(({ title, value, onPress, icon }) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
    >
        <View style={styles.settingLeft}>
            <Ionicons
                name={icon}
                size={24}
                color={theme.colors.text}
            />
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingValue}>{value}</Text>
            </View>
        </View>
        <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
        />
    </TouchableOpacity>
));

const ImageUploadItem = memo(({ title, imageUrl, onPress, aspectRatio }) => (
    <TouchableOpacity
        style={styles.imageUploadItem}
        onPress={onPress}
    >
        <Text style={styles.imageTitle}>{title}</Text>
        {imageUrl ? (
            <Image
                source={{ uri: imageUrl }}
                style={[styles.uploadedImage, { aspectRatio }]}
            />
        ) : (
            <View style={[styles.imagePlaceholder, { aspectRatio }]}>
                <Ionicons
                    name="cloud-upload-outline"
                    size={32}
                    color={theme.colors.textSecondary}
                />
                <Text style={styles.uploadText}>이미지 업로드</Text>
            </View>
        )}
    </TouchableOpacity>
));

const EditModal = memo(({
                            visible,
                            title,
                            value,
                            onClose,
                            onConfirm,
                            keyboardType = 'default'
                        }) => {
    const [editValue, setEditValue] = useState(value);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={styles.modalContent}
                    onStartShouldSetResponder={() => true}
                >
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TextInput
                        style={styles.modalInput}
                        value={editValue}
                        onChangeText={setEditValue}
                        placeholder="입력해주세요"
                        keyboardType={keyboardType}
                        autoFocus
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={onClose}
                        >
                            <Text style={styles.modalButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.confirmButton]}
                            onPress={() => {
                                onConfirm(editValue);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Text style={[styles.modalButtonText, styles.confirmText]}>
                                확인
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
});

const GroupSettingsScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [loading, setLoading] = useState(false);
    const [groupInfo, setGroupInfo] = useState({
        category: '',
        goals: [],
        memberLimit: 0,
        icon: null,
        banner: null,
        rules: []
    });
    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        field: '',
        value: '',
        keyboardType: 'default'
    });

    const fetchGroupSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupSettings(groupId);
            setGroupInfo(response.settings);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '그룹 설정을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchGroupSettings();
            return () => {
                setGroupInfo({
                    category: '',
                    goals: [],
                    memberLimit: 0,
                    icon: null,
                    banner: null,
                    rules: []
                });
            };
        }, [fetchGroupSettings])
    );

    const handleUpdateSetting = useCallback(async (value) => {
        try {
            setLoading(true);
            await groupAPI.updateGroupSettings(groupId, {
                [modalConfig.field]: value
            });

            setGroupInfo(prev => ({
                ...prev,
                [modalConfig.field]: value
            }));
            setModalConfig(prev => ({ ...prev, visible: false }));
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Alert.alert('오류', error.message || '설정 업데이트에 실패했습니다');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    }, [groupId, modalConfig.field]);

    const handleImageUpload = useCallback(async (type) => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('권한 필요', '이미지 업로드를 위해 갤러리 접근 권한이 필요합니다');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'icon' ? [1, 1] : [16, 9],
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

                const response = await groupAPI.uploadGroupImage(groupId, formData);
                setGroupInfo(prev => ({
                    ...prev,
                    [type]: response.imageUrl
                }));
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            Alert.alert('오류', error.message || '이미지 업로드에 실패했습니다');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [groupId]);

    const handleDeleteGroup = useCallback(async () => {
        Alert.alert(
            '그룹 삭제',
            '정말로 이 그룹을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await groupAPI.deleteGroup(groupId);
                            Alert.alert('성공', '그룹이 삭제되었습니다.', [
                                {
                                    text: '확인',
                                    onPress: () => navigation.navigate('GroupList')
                                }
                            ]);
                        } catch (error) {
                            Alert.alert(
                                '오류',
                                error.response?.data?.message || '그룹 삭제에 실패했습니다.'
                            );
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }, [groupId, navigation]);

    if (loading && !groupInfo.category) {
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
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 설정</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>
                    <SettingItem
                        title="카테고리"
                        value={groupInfo.category}
                        icon="grid-outline"
                        onPress={() => setModalConfig({
                            visible: true,
                            title: '카테고리 수정',
                            field: 'category',
                            value: groupInfo.category
                        })}
                    />
                    <SettingItem
                        title="최대 인원"
                        value={`${groupInfo.memberLimit}명`}
                        icon="people-outline"
                        onPress={() => setModalConfig({
                            visible: true,
                            title: '최대 인원 수정',
                            field: 'memberLimit',
                            value: String(groupInfo.memberLimit),
                            keyboardType: 'number-pad'
                        })}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>이미지 설정</Text>
                    <ImageUploadItem
                        title="그룹 아이콘"
                        imageUrl={groupInfo.icon}
                        onPress={() => handleImageUpload('icon')}
                        aspectRatio={1}
                    />
                    <ImageUploadItem
                        title="그룹 배너"
                        imageUrl={groupInfo.banner}
                        onPress={() => handleImageUpload('banner')}
                        aspectRatio={16/9}
                    />
                </View>
            </ScrollView>

            <EditModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                value={modalConfig.value}
                keyboardType={modalConfig.keyboardType}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={handleUpdateSetting}
            />

            <View style={styles.dangerZone}>
                <Text style={styles.dangerTitle}>위험 구역</Text>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteGroup}
                >
                    <Text style={styles.deleteButtonText}>그룹 삭제</Text>
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
    scrollView: {
        flex: 1,
    },
    coverImageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.surface,
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
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    inputContainer: {
        marginBottom: theme.spacing.md,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    label: {
        ...theme.typography.bodyLarge,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    description: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.md,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    inputError: {
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    errorText: {
        ...theme.typography.bodySmall,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    typeButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    typeButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    typeButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    typeButtonTextActive: {
        color: theme.colors.white,
    },
    privateToggle: {
        padding: theme.spacing.sm,
    },
    tagInput: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    tagAddButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
    },
    tagAddButtonDisabled: {
        backgroundColor: theme.colors.disabled,
    },
    tagAddButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.roundness.full,
        paddingVertical: 4,
        paddingHorizontal: 12,
        gap: 4,
    },
    tagText: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
    },
    questionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    questionText: {
        flex: 1,
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginRight: theme.spacing.sm,
    },
    questionRemoveButton: {
        padding: theme.spacing.xs,
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginRight: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    createButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    cancelButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    createButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
    },
    dangerZone: {
        marginTop: 24,
        padding: 16,
        backgroundColor: theme.colors.errorLight,
        borderRadius: 8,
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.error,
        marginBottom: 12,
    },
    deleteButton: {
        backgroundColor: theme.colors.error,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

GroupSettingsScreen.displayName = 'GroupSettingsScreen';

export default memo(GroupSettingsScreen);
// src/screens/group/GroupSettingsScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    Image,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import { Avatar } from '../../components/UI';
import api from '../../services/api';

export default function GroupSettingsScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { groupId } = route.params;

    // 상태 관리
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        name: '',
        description: '',
        coverImage: null,
        isPrivate: false,
        joinApproval: 'auto', // auto, manual
        maxMembers: '',
        allowMemberInvite: true,
        allowMemberPost: true,
        notificationSettings: {
            newMembers: true,
            memberLeave: true,
            posts: true,
            comments: true
        },
        tags: []
    });

    // 에러 상태
    const [errors, setErrors] = useState({
        name: '',
        description: '',
        maxMembers: ''
    });

    // 초기 데이터 로드
    useEffect(() => {
        loadGroupSettings();
    }, []);

    const loadGroupSettings = async () => {
        try {
            setIsLoading(true);
            const response = await api.group.getGroupSettings(groupId);
            setSettings(response);
        } catch (error) {
            Alert.alert('오류', '그룹 설정을 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    // 이미지 선택
    const handleImagePick = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSettings(prev => ({
                    ...prev,
                    coverImage: result.assets[0]
                }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            Alert.alert('오류', '이미지를 선택하는데 실패했습니다.');
        }
    };

    // 유효성 검사
    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!settings.name.trim()) {
            newErrors.name = '그룹 이름을 입력해주세요';
            isValid = false;
        } else if (settings.name.length < 2 || settings.name.length > 20) {
            newErrors.name = '그룹 이름은 2-20자 사이여야 합니다';
            isValid = false;
        }

        if (!settings.description.trim()) {
            newErrors.description = '그룹 설명을 입력해주세요';
            isValid = false;
        }

        const maxMembers = parseInt(settings.maxMembers);
        if (isNaN(maxMembers) || maxMembers < 2 || maxMembers > 100) {
            newErrors.maxMembers = '최대 인원은 2-100명 사이여야 합니다';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // 설정 저장
    const handleSave = async () => {
        if (!validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        try {
            setIsSaving(true);
            const formData = new FormData();

            // 기본 정보
            formData.append('name', settings.name);
            formData.append('description', settings.description);
            formData.append('isPrivate', settings.isPrivate);
            formData.append('joinApproval', settings.joinApproval);
            formData.append('maxMembers', settings.maxMembers);
            formData.append('allowMemberInvite', settings.allowMemberInvite);
            formData.append('allowMemberPost', settings.allowMemberPost);
            formData.append('notificationSettings', JSON.stringify(settings.notificationSettings));
            formData.append('tags', JSON.stringify(settings.tags));

            // 커버 이미지
            if (settings.coverImage?.uri) {
                const imageUri = settings.coverImage.uri;
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image';

                formData.append('coverImage', {
                    uri: imageUri,
                    name: filename,
                    type
                });
            }

            await api.group.updateGroupSettings(groupId, formData);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
        } catch (error) {
            Alert.alert('오류', '설정 저장에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsSaving(false);
        }
    };

    // 그룹 삭제
    const handleDeleteGroup = () => {
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
                            await api.group.deleteGroup(groupId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            navigation.navigate('GroupList');
                        } catch (error) {
                            Alert.alert('오류', '그룹 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* 커버 이미지 */}
                <TouchableOpacity
                    style={styles.coverImageContainer}
                    onPress={handleImagePick}
                >
                    {settings.coverImage ? (
                        <Image
                            source={{ uri: settings.coverImage.uri || settings.coverImage }}
                            style={styles.coverImage}
                        />
                    ) : (
                        <View style={styles.coverImagePlaceholder}>
                            <Ionicons name="image-outline" size={48} color={theme.colors.text.secondary} />
                            <Text style={styles.coverImageText}>커버 이미지 변경</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 기본 정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>그룹 이름</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.name && styles.inputError
                            ]}
                            value={settings.name}
                            onChangeText={(text) => {
                                setSettings(prev => ({ ...prev, name: text }));
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            placeholder="그룹 이름 입력 (2-20자)"
                            maxLength={20}
                        />
                        {errors.name && (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>그룹 설명</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                errors.description && styles.inputError
                            ]}
                            value={settings.description}
                            onChangeText={(text) => {
                                setSettings(prev => ({ ...prev, description: text }));
                                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                            }}
                            placeholder="그룹 설명 입력"
                            multiline
                            numberOfLines={4}
                        />
                        {errors.description && (
                            <Text style={styles.errorText}>{errors.description}</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>최대 인원</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.maxMembers && styles.inputError
                            ]}
                            value={settings.maxMembers.toString()}
                            onChangeText={(text) => {
                                setSettings(prev => ({ ...prev, maxMembers: text }));
                                if (errors.maxMembers) setErrors(prev => ({ ...prev, maxMembers: '' }));
                            }}
                            placeholder="최대 인원 입력 (2-100명)"
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                        {errors.maxMembers && (
                            <Text style={styles.errorText}>{errors.maxMembers}</Text>
                        )}
                    </View>
                </View>

                {/* 공개 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>공개 설정</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>비공개 그룹</Text>
                            <Text style={styles.settingDescription}>
                                초대를 통해서만 가입할 수 있습니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.isPrivate}
                            onValueChange={(value) => {
                                setSettings(prev => ({ ...prev, isPrivate: value }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.isPrivate
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>가입 승인</Text>
                            <Text style={styles.settingDescription}>
                                새로운 멤버의 가입을 승인해야 합니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.joinApproval === 'manual'}
                            onValueChange={(value) => {
                                setSettings(prev => ({
                                    ...prev,
                                    joinApproval: value ? 'manual' : 'auto'
                                }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.joinApproval === 'manual'
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>
                </View>

                {/* 멤버 권한 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>멤버 권한</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>멤버 초대 허용</Text>
                            <Text style={styles.settingDescription}>
                                멤버가 다른 사용자를 초대할 수 있습니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.allowMemberInvite}
                            onValueChange={(value) => {
                                setSettings(prev => ({ ...prev, allowMemberInvite: value }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.allowMemberInvite
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>멤버 게시글 작성</Text>
                            <Text style={styles.settingDescription}>
                                멤버가 게시글을 작성할 수 있습니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.allowMemberPost}
                            onValueChange={(value) => {
                                setSettings(prev => ({ ...prev, allowMemberPost: value }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.allowMemberPost
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>
                </View>

                {/* 알림 설정 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>알림 설정</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>새 멤버 참가</Text>
                            <Text style={styles.settingDescription}>
                                새로운 멤버가 참가할 때 알림을 받습니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.notificationSettings.newMembers}
                            onValueChange={(value) => {
                                setSettings(prev => ({
                                    ...prev,
                                    notificationSettings: {
                                        ...prev.notificationSettings,
                                        newMembers: value
                                    }
                                }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.notificationSettings.newMembers
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>멤버 탈퇴</Text>
                            <Text style={styles.settingDescription}>
                                멤버가 그룹을 나갈 때 알림을 받습니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.notificationSettings.memberLeave}
                            onValueChange={(value) => {
                                setSettings(prev => ({
                                    ...prev,
                                    notificationSettings: {
                                        ...prev.notificationSettings,
                                        memberLeave: value
                                    }
                                }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.notificationSettings.memberLeave
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>새 게시글</Text>
                            <Text style={styles.settingDescription}>
                                새로운 게시글이 작성될 때 알림을 받습니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.notificationSettings.posts}
                            onValueChange={(value) => {
                                setSettings(prev => ({
                                    ...prev,
                                    notificationSettings: {
                                        ...prev.notificationSettings,
                                        posts: value
                                    }
                                }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.notificationSettings.posts
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Text style={styles.settingText}>댓글</Text>
                            <Text style={styles.settingDescription}>
                                새로운 댓글이 작성될 때 알림을 받습니다
                            </Text>
                        </View>
                        <Switch
                            value={settings.notificationSettings.comments}
                            onValueChange={(value) => {
                                setSettings(prev => ({
                                    ...prev,
                                    notificationSettings: {
                                        ...prev.notificationSettings,
                                        comments: value
                                    }
                                }));
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            trackColor={{
                                false: theme.colors.grey[200],
                                true: theme.colors.primary.main + '50'
                            }}
                            thumbColor={settings.notificationSettings.comments
                                ? theme.colors.primary.main
                                : theme.colors.grey[400]
                            }
                        />
                    </View>
                </View>

                {/* 그룹 삭제 */}
                <View style={styles.deleteSection}>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeleteGroup}
                    >
                        <Text style={styles.deleteButtonText}>그룹 삭제</Text>
                    </TouchableOpacity>
                    <Text style={styles.deleteDescription}>
                        그룹을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                    </Text>
                </View>
            </ScrollView>

            {/* 저장 버튼 */}
            <View style={styles.bottomButtons}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        isSaving && styles.saveButtonDisabled
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>저장</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    coverImageContainer: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.background.secondary,
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
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
    },
    section: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.typography.size.h4,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    inputContainer: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.size.body2,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.components.borderRadius,
        padding: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    inputError: {
        borderWidth: 1,
        borderColor: theme.colors.status.error,
    },
    errorText: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.status.error,
        marginTop: theme.spacing.xs,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    settingLabel: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    settingText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    settingDescription: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    deleteSection: {
        padding: theme.spacing.lg,
    },
    deleteButton: {
        backgroundColor: theme.colors.status.error + '20',
        padding: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    deleteButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.status.error,
    },
    deleteDescription: {
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    bottomButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background.primary,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginRight: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    saveButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.primary.main,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: theme.colors.grey[300],
    },
    cancelButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.primary,
    },
    saveButtonText: {
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
        color: theme.colors.text.contrast,
    }
});
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Modal,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

const GroupSettingsScreen = ({ navigation, route }) => {
    const [groupInfo, setGroupInfo] = useState({
        category: '',
        goals: [],
        memberLimit: 0,
        icon: null,
        banner: null,
        rules: []
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const { groupId } = route.params;

    useEffect(() => {
        fetchGroupSettings();
    }, [groupId]);

    const fetchGroupSettings = async () => {
        try {
            const response = await groupAPI.getGroupSettings(groupId);
            setGroupInfo(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '그룹 설정을 불러오는데 실패했습니다.');
        }
    };

    const handleUpdateSetting = async (field, value) => {
        try {
            const response = await groupAPI.updateGroupSettings(groupId, {
                [field]: value
            });
            if (response.data.success) {
                setGroupInfo(prev => ({
                    ...prev,
                    [field]: value
                }));
                setShowEditModal(false);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '설정 업데이트에 실패했습니다.');
        }
    };

    const handleImageUpload = async (type) => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('권한 필요', '이미지 업로드를 위해 갤러리 접근 권한이 필요합니다.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'icon' ? [1, 1] : [16, 9],
                quality: 1,
            });

            if (!result.canceled) {
                const response = await groupAPI.uploadGroupImage(groupId, {
                    type,
                    uri: result.assets[0].uri
                });

                if (response.data.success) {
                    setGroupInfo(prev => ({
                        ...prev,
                        [type]: response.data.imageUrl
                    }));
                }
            }
        } catch (error) {
            Alert.alert('오류', '이미지 업로드에 실패했습니다.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 설정</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* 기존 JSX 컴포넌트들... */}

            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingField === 'category' ? '카테고리 수정' :
                                editingField === 'memberLimit' ? '인원 제한 수정' :
                                    '설정 수정'}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editValue}
                            onChangeText={setEditValue}
                            placeholder="입력해주세요"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setShowEditModal(false)}
                            >
                                <Text style={styles.modalButtonText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={() => handleUpdateSetting(editingField, editValue)}
                            >
                                <Text style={[styles.modalButtonText, styles.confirmText]}>
                                    확인
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // 기존 스타일 유지...
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        padding: 10,
        marginLeft: 10,
    },
    confirmButton: {
        backgroundColor: '#0066FF',
        borderRadius: 8,
    },
    modalButtonText: {
        fontSize: 16,
    },
    confirmText: {
        color: '#fff',
    }
});

export default GroupSettingsScreen;
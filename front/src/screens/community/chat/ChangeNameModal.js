import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert
} from 'react-native';
import { userAPI } from '../../../services/api';

const ChangeNameModal = ({
                             visible,
                             onClose,
                             onSuccess,
                             currentName,
                             title = '이름 변경',
                             placeholder = '새로운 이름을 입력하세요'
                         }) => {
    const [newName, setNewName] = useState(currentName || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateName = (name) => {
        if (!name.trim()) return '이름을 입력해주세요';
        if (name.length < 2) return '이름은 2자 이상이어야 합니다';
        if (name.length > 30) return '이름은 30자를 초과할 수 없습니다';
        return '';
    };

    const handleSubmit = async () => {
        try {
            const validationError = validateName(newName);
            if (validationError) {
                setError(validationError);
                return;
            }

            setLoading(true);
            setError('');

            // 서버 측 이름 유효성 검사
            const validationResponse = await userAPI.validateName(newName);
            if (!validationResponse.data.isValid) {
                setError(validationResponse.data.message);
                return;
            }

            // 이름 변경 요청
            const response = await userAPI.updateName(newName);

            if (response.status === 200) {
                onSuccess?.(newName);
                onClose();
                Alert.alert('성공', '이름이 변경되었습니다.');
            }
        } catch (error) {
            setError(error.response?.data?.message || '이름 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNewName(currentName || '');
        setError('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TextInput
                                style={[
                                    styles.modalInput,
                                    error && styles.inputError
                                ]}
                                value={newName}
                                onChangeText={(text) => {
                                    setNewName(text);
                                    setError('');
                                }}
                                placeholder={placeholder}
                                autoFocus={true}
                                maxLength={30}
                                editable={!loading}
                            />
                            {error ? (
                                <Text style={styles.errorText}>{error}</Text>
                            ) : (
                                <Text style={styles.helperText}>
                                    {`${newName.length}/30자`}
                                </Text>
                            )}
                            <View style={styles.modalButtons}>
                                <Pressable
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={handleClose}
                                    disabled={loading}
                                >
                                    <Text style={styles.cancelButtonText}>취소</Text>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.modalButton,
                                        styles.confirmButton,
                                        loading && styles.disabledButton
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>변경</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f1f1f1',
    },
    confirmButton: {
        backgroundColor: '#4A90E2',
    },
    cancelButtonText: {
        color: '#333',
        textAlign: 'center',
        fontSize: 16,
    },
    confirmButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: -15,
        marginBottom: 15,
        marginLeft: 5,
    },
    helperText: {
        color: '#666',
        fontSize: 12,
        marginTop: -15,
        marginBottom: 15,
        marginLeft: 5,
    },
    disabledButton: {
        opacity: 0.6,
    }
});

export default ChangeNameModal;
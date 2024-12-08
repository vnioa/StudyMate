import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../../styles/theme';
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

const EditRoomNameScreen = ({ navigation, route }) => {
    const { roomId, currentName, onUpdate } = route.params;
    const [newName, setNewName] = useState(currentName);
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

    const handleSave = async () => {
        if (!newName.trim()) {
            Alert.alert('오류', '채팅방 이름을 입력해주세요.');
            return;
        }

        if (!(await checkNetwork())) return;

        try {
            setLoading(true);
            const response = await api.put(`/api/chat/rooms/${roomId}/name`, {
                roomName: newName.trim()
            });

            if (response.data.success) {
                if (onUpdate) {
                    await onUpdate();
                }
                await AsyncStorage.setItem(`roomName_${roomId}`, newName.trim());
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '채팅방 이름 변경에 실패했습니다.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="x" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>채팅방 이름 변경</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading || !isOnline}
                >
                    <Text style={[
                        styles.saveButton,
                        (!isOnline || loading) && styles.disabledButton
                    ]}>
                        저장
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <TextInput
                    style={[
                        styles.input,
                        !isOnline && styles.disabledInput
                    ]}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="채팅방 이름을 입력하세요"
                    placeholderTextColor={theme.colors.textTertiary}
                    maxLength={30}
                    autoFocus
                    editable={isOnline}
                />
                {loading && (
                    <ActivityIndicator
                        style={styles.loader}
                        size="small"
                        color={theme.colors.primary}
                    />
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    saveButton: {
        ...theme.typography.labelLarge,
        color: theme.colors.primary,
    },
    disabledButton: {
        color: theme.colors.textDisabled,
    },
    content: {
        padding: theme.spacing.md,
    },
    input: {
        ...theme.typography.bodyLarge,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingVertical: theme.spacing.sm,
        color: theme.colors.text,
    },
    disabledInput: {
        color: theme.colors.textDisabled,
        borderBottomColor: theme.colors.disabled,
    },
    loader: {
        marginTop: theme.spacing.md,
        alignSelf: 'center',
    }
});

export default EditRoomNameScreen;
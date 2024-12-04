import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { chatAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const EditRoomNameScreen = ({ navigation, route }) => {
    const { roomId, currentName, onUpdate } = route.params;
    const [newName, setNewName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!newName.trim()) {
            Alert.alert('오류', '채팅방 이름을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            await chatAPI.updateRoomName(roomId, { roomName: newName.trim() });
            if (onUpdate) {
                await onUpdate();
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('오류', error.message || '채팅방 이름 변경에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
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
                    disabled={loading}
                >
                    <Text style={styles.saveButton}>저장</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <TextInput
                    style={styles.input}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="채팅방 이름을 입력하세요"
                    maxLength={30}
                    autoFocus
                />
                {loading && (
                    <ActivityIndicator
                        style={styles.loader}
                        size="small"
                        color={theme.colors.primary}
                    />
                )}
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
    saveButton: {
        ...theme.typography.labelLarge,
        color: theme.colors.primary,
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
    loader: {
        marginTop: theme.spacing.md,
    },
});

export default EditRoomNameScreen; 
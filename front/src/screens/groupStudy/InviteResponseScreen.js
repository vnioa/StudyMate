import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { inviteAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const InviteResponseScreen = ({ navigation, route }) => {
    const { inviteId, groupId } = route.params;
    const [loading, setLoading] = useState(false);

    const handleInviteResponse = useCallback(async (action) => {
        try {
            setLoading(true);
            if (action === 'accept') {
                await inviteAPI.acceptInvitation(inviteId);
                Alert.alert('알림', '그룹 가입이 완료되었습니다.');
                navigation.navigate('GroupDetail', { groupId });
            } else {
                await inviteAPI.rejectInvitation(inviteId);
                Alert.alert('알림', '초대를 거절했습니다.');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '처리에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [inviteId, groupId, navigation]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>그룹 초대</Text>
            <Text style={styles.message}>그룹에 가입하시겠습니까?</Text>
            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleInviteResponse('accept')}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>수락</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleInviteResponse('reject')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>거절</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.background,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: theme.colors.text,
    },
    message: {
        fontSize: 16,
        marginBottom: 32,
        color: theme.colors.textSecondary,
    },
    buttons: {
        flexDirection: 'row',
        gap: 16,
    },
    acceptButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    rejectButton: {
        backgroundColor: theme.colors.error,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default InviteResponseScreen; 
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    BackHandler
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { inviteAPI } from '../../services/api';
import Icon from 'react-native-vector-icons/Feather';

const InviteResponseScreen = ({ navigation, route }) => {
    const { inviteId, groupId } = route.params;
    const [loading, setLoading] = useState(false);
    const [inviteDetails, setInviteDetails] = useState(null);
    const [error, setError] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const fetchInviteDetails = async () => {
                try {
                    const details = await inviteAPI.getInviteDetails(inviteId);
                    setInviteDetails(details);
                } catch (err) {
                    setError('초대 정보를 불러올 수 없습니다.');
                    Alert.alert('오류', '초대 정보를 불러올 수 없습니다.', [
                        { text: '확인', onPress: () => navigation.goBack() }
                    ]);
                }
            };
            fetchInviteDetails();
        }, [inviteId])
    );

    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                if (!loading) {
                    handleInviteResponse('reject');
                    return true;
                }
                return false;
            }
        );

        return () => backHandler.remove();
    }, [loading]);

    const handleInviteResponse = useCallback(async (action) => {
        if (loading) return;

        try {
            setLoading(true);
            if (action === 'accept') {
                await inviteAPI.acceptInvitation(inviteId);
                Alert.alert('완료', '그룹 가입이 완료되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => navigation.replace('GroupDetail', { groupId })
                    }
                ]);
            } else {
                await inviteAPI.rejectInvitation(inviteId);
                Alert.alert('완료', '초대를 거절했습니다.', [
                    {
                        text: '확인',
                        onPress: () => navigation.goBack()
                    }
                ]);
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '처리 중 문제가 발생했습니다. 다시 시도해주세요.'
            );
        } finally {
            setLoading(false);
        }
    }, [inviteId, groupId, navigation, loading]);

    if (error) {
        return (
            <View style={styles.container}>
                <Icon name="alert-circle" size={48} color="#FF5252" />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Icon name="users" size={48} color="#4A90E2" style={styles.icon} />
                <Text style={styles.title}>그룹 초대</Text>
                {inviteDetails && (
                    <>
                        <Text style={styles.groupName}>{inviteDetails.groupName}</Text>
                        <Text style={styles.inviter}>
                            초대자: {inviteDetails.inviterName}
                        </Text>
                    </>
                )}
                <Text style={styles.message}>
                    그룹에 가입하시겠습니까?
                </Text>
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleInviteResponse('reject')}
                    disabled={loading}
                >
                    <Text style={[styles.buttonText, styles.rejectText]}>거절</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => handleInviteResponse('accept')}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>수락</Text>
                    )}
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
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        marginBottom: 40,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333333',
    },
    groupName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        color: '#4A90E2',
    },
    inviter: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 150,
    },
    acceptButton: {
        backgroundColor: '#4A90E2',
    },
    rejectButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FF5252',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    rejectText: {
        color: '#FF5252',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
    }
});

export default InviteResponseScreen;
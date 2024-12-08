import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
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

const ParticipantItem = ({ participant, onRemove, isOnline }) => (
    <View style={[
        styles.participantItem,
        !isOnline && styles.participantItemDisabled
    ]}>
        <View style={styles.participantInfo}>
            <Icon
                name="user"
                size={24}
                color={isOnline ? theme.colors.text : theme.colors.textDisabled}
            />
            <Text style={[
                styles.participantName,
                !isOnline && styles.textDisabled
            ]}>
                {participant.name}
            </Text>
        </View>
        {onRemove && (
            <TouchableOpacity
                onPress={() => onRemove(participant)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={!isOnline}
            >
                <Icon
                    name="x"
                    size={20}
                    color={isOnline ? theme.colors.error : theme.colors.textDisabled}
                />
            </TouchableOpacity>
        )}
    </View>
);

const ParticipantManagementScreen = ({ navigation, route }) => {
    const { roomId, onUpdate } = route.params;
    const [participants, setParticipants] = useState([]);
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

    const fetchParticipants = useCallback(async () => {
        if (!(await checkNetwork())) {
            const cachedParticipants = await AsyncStorage.getItem(`participants_${roomId}`);
            if (cachedParticipants) {
                setParticipants(JSON.parse(cachedParticipants));
            }
            return;
        }

        try {
            setLoading(true);
            const response = await api.get(`/api/chat/rooms/${roomId}/participants`);
            if (response.data.success) {
                setParticipants(response.data.participants);
                await AsyncStorage.setItem(
                    `participants_${roomId}`,
                    JSON.stringify(response.data.participants)
                );
            }
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '참여자 목록을 불러오는데 실패했습니다.'
            );
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useFocusEffect(
        useCallback(() => {
            fetchParticipants();
            const unsubscribe = NetInfo.addEventListener(state => {
                setIsOnline(state.isConnected);
            });
            return () => {
                unsubscribe();
                setParticipants([]);
            };
        }, [fetchParticipants])
    );

    const handleRemoveParticipant = async (participant) => {
        if (!(await checkNetwork())) return;

        Alert.alert(
            '참여자 추방',
            `${participant.name}님을 채팅방에서 추방하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '제거',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const response = await api.put(`/api/chat/rooms/${roomId}/participants`, {
                                participants: participants
                                    .filter(p => p.id !== participant.id)
                                    .map(p => p.id)
                            });

                            if (response.data.success) {
                                await fetchParticipants();
                                if (onUpdate) {
                                    await onUpdate();
                                }
                            }
                        } catch (error) {
                            Alert.alert(
                                '오류',
                                error.response?.data?.message || '참여자 추방에 실패했습니다.'
                            );
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>참여자 관리</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator
                    style={styles.loader}
                    size="large"
                    color={theme.colors.primary}
                />
            ) : (
                <FlatList
                    data={participants}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ParticipantItem
                            participant={item}
                            onRemove={handleRemoveParticipant}
                            isOnline={isOnline}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
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
    listContent: {
        padding: theme.spacing.md,
    },
    participantItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    participantItemDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.disabled,
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    participantName: {
        ...theme.typography.bodyLarge,
        marginLeft: theme.spacing.md,
        color: theme.colors.text,
    },
    textDisabled: {
        color: theme.colors.textDisabled,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default ParticipantManagementScreen;
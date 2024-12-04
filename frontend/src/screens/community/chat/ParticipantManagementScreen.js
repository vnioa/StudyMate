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
import { chatAPI } from '../../../services/api';
import { theme } from '../../../styles/theme';

const ParticipantItem = ({ participant, onRemove }) => (
    <View style={styles.participantItem}>
        <View style={styles.participantInfo}>
            <Icon name="user" size={24} color={theme.colors.text} />
            <Text style={styles.participantName}>{participant.name}</Text>
        </View>
        {onRemove && (
            <TouchableOpacity
                onPress={() => onRemove(participant)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon name="x" size={20} color={theme.colors.error} />
            </TouchableOpacity>
        )}
    </View>
);

const ParticipantManagementScreen = ({ navigation, route }) => {
    const { roomId, onUpdate } = route.params;
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchParticipants = useCallback(async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getRoomInfo(roomId);
            setParticipants(response.participants);
        } catch (error) {
            Alert.alert('오류', error.message || '참여자 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useFocusEffect(
        useCallback(() => {
            fetchParticipants();
        }, [fetchParticipants])
    );

    const handleRemoveParticipant = async (participant) => {
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
                            await chatAPI.updateParticipants(roomId, {
                                participants: participants
                                    .filter(p => p.id !== participant.id)
                                    .map(p => p.id)
                            });
                            await fetchParticipants();
                            if (onUpdate) {
                                await onUpdate();
                            }
                        } catch (error) {
                            Alert.alert('오류', error.message || '참여자 추방에 실패했습니다.');
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
        borderRadius: theme.roundness.md,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
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
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ParticipantManagementScreen; 
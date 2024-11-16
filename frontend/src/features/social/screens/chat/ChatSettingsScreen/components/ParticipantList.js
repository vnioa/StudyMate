// features/social/screens/chat/ChatSettingsScreen/components/ParticipantList.js
import React, { memo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from '../styles';

const ParticipantList = ({
                             participants = [],
                             onAdd,
                             onRemove,
                             isEditing,
                             currentUserId = 'currentUserId' // 실제 사용자 ID로 변경 필요
                         }) => {
    const navigation = useNavigation();
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // 참가자 선택 처리
    const handleSelectParticipant = useCallback((participantId) => {
        setSelectedParticipants(prev => {
            if (prev.includes(participantId)) {
                return prev.filter(id => id !== participantId);
            }
            return [...prev, participantId];
        });
    }, []);

    // 참가자 초대
    const handleInvite = useCallback(() => {
        navigation.navigate('InviteParticipants', {
            currentParticipants: participants,
            onSelect: onAdd
        });
    }, [navigation, participants, onAdd]);

    // 참가자 제거
    const handleRemove = useCallback(() => {
        if (selectedParticipants.length === 0) {
            Alert.alert('알림', '제거할 참가자를 선택해주세요.');
            return;
        }

        Alert.alert(
            '참가자 제거',
            '선택한 참가자를 제거하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '제거',
                    style: 'destructive',
                    onPress: () => {
                        selectedParticipants.forEach(participantId => {
                            onRemove(participantId);
                        });
                        setSelectedParticipants([]);
                    }
                }
            ]
        );
    }, [selectedParticipants, onRemove]);

    // 참가자 아이템 렌더링
    const renderParticipant = useCallback(({ item: participant }) => {
        const isSelected = selectedParticipants.includes(participant.id);
        const isCurrentUser = participant.id === currentUserId;

        return (
            <TouchableOpacity
                style={[
                    styles.participantItem,
                    isSelected && styles.participantItemSelected
                ]}
                onPress={() => isEditing && !isCurrentUser && handleSelectParticipant(participant.id)}
                disabled={!isEditing || isCurrentUser}
            >
                <View style={styles.participantInfo}>
                    <Image
                        source={
                            participant.avatar
                                ? { uri: participant.avatar }
                                : require('../../../../../../assets/icons/user.png')
                        }
                        style={styles.participantAvatar}
                    />
                    <View style={styles.participantDetails}>
                        <Text style={styles.participantName}>
                            {participant.name}
                            {isCurrentUser && ' (나)'}
                        </Text>
                        {participant.joinedAt && (
                            <Text style={styles.participantJoinDate}>
                                {format(new Date(participant.joinedAt), 'yyyy년 M월 d일 가입', { locale: ko })}
                            </Text>
                        )}
                    </View>
                </View>
                {participant.isOnline && (
                    <View style={styles.onlineIndicator} />
                )}
                {isEditing && !isCurrentUser && (
                    <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={24}
                        color={isSelected ? '#0057D9' : '#8E8E93'}
                    />
                )}
            </TouchableOpacity>
        );
    }, [isEditing, selectedParticipants, currentUserId, handleSelectParticipant]);

    // 구분선 렌더링
    const renderSeparator = useCallback(() => (
        <View style={styles.participantSeparator} />
    ), []);

    return (
        <View style={styles.participantListContainer}>
            <View style={styles.participantHeader}>
                <Text style={styles.participantTitle}>
                    참가자 {participants.length}명
                </Text>
                {isEditing && (
                    <View style={styles.participantActions}>
                        <TouchableOpacity
                            style={styles.participantAction}
                            onPress={handleInvite}
                        >
                            <Ionicons name="person-add" size={24} color="#0057D9" />
                            <Text style={styles.participantActionText}>초대</Text>
                        </TouchableOpacity>
                        {selectedParticipants.length > 0 && (
                            <TouchableOpacity
                                style={[styles.participantAction, styles.removeAction]}
                                onPress={handleRemove}
                            >
                                <Ionicons name="person-remove" size={24} color="#FF3B30" />
                                <Text style={[styles.participantActionText, styles.removeText]}>
                                    제거 ({selectedParticipants.length})
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
            <FlatList
                data={participants}
                renderItem={renderParticipant}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={renderSeparator}
                contentContainerStyle={styles.participantListContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

ParticipantList.defaultProps = {
    participants: [],
    isEditing: false,
    onAdd: null,
    onRemove: () => {}
};

export default memo(ParticipantList);
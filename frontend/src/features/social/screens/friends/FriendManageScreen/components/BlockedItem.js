// features/social/screens/friend/FriendManageScreen/components/BlockedItem.js
import React, { memo, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from '../styles';

const BlockedItem = ({
                         user,
                         isSelected,
                         isEditing,
                         onSelect,
                         onUnblock,
                         showBlockedDate = true
                     }) => {
    const {
        id,
        name,
        avatar,
        email,
        blockedAt,
        reason,
        mutualFriends
    } = user;

    // 차단 해제 처리
    const handleUnblock = useCallback(() => {
        Alert.alert(
            '차단 해제',
            `${name}님의 차단을 해제하시겠습니까?\n차단 해제 후 다시 친구 추가가 가능합니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '해제',
                    onPress: () => onUnblock?.(id)
                }
            ]
        );
    }, [id, name, onUnblock]);

    // 상세 정보 표시
    const handleLongPress = useCallback(() => {
        Alert.alert(
            name,
            `이메일: ${email}\n${
                reason ? `차단 사유: ${reason}\n` : ''
            }차단일: ${format(new Date(blockedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}`,
            [
                {
                    text: '차단 해제',
                    onPress: handleUnblock
                },
                {
                    text: '닫기',
                    style: 'cancel'
                }
            ]
        );
    }, [name, email, reason, blockedAt, handleUnblock]);

    return (
        <TouchableOpacity
            style={[
                styles.blockedItem,
                isSelected && styles.blockedItemSelected
            ]}
            onPress={() => isEditing ? onSelect?.(id) : handleUnblock()}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.userInfo}>
                {isEditing && (
                    <TouchableOpacity
                        style={styles.checkBox}
                        onPress={() => onSelect?.(id)}
                    >
                        <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={isSelected ? '#0057D9' : '#8E8E93'}
                        />
                    </TouchableOpacity>
                )}

                <Image
                    source={
                        avatar
                            ? { uri: avatar }
                            : require('../../../../../../assets/icons/user.png')
                    }
                    style={styles.avatar}
                    defaultSource={require('../../../../../../assets/icons/user.png')}
                />

                <View style={styles.userDetails}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {name}
                        </Text>
                        {email && (
                            <Text style={styles.userEmail} numberOfLines={1}>
                                {email}
                            </Text>
                        )}
                    </View>

                    <View style={styles.infoContainer}>
                        {showBlockedDate && (
                            <Text style={styles.blockedDate}>
                                차단일: {format(new Date(blockedAt), 'yyyy.MM.dd', { locale: ko })}
                            </Text>
                        )}
                        {mutualFriends > 0 && (
                            <Text style={styles.mutualFriends}>
                                함께 아는 친구 {mutualFriends}명
                            </Text>
                        )}
                        {reason && (
                            <Text style={styles.blockReason} numberOfLines={1}>
                                사유: {reason}
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            {!isEditing && (
                <TouchableOpacity
                    style={styles.unblockButton}
                    onPress={handleUnblock}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.unblockText}>해제</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

BlockedItem.defaultProps = {
    isSelected: false,
    isEditing: false,
    showBlockedDate: true,
    onSelect: null,
    onUnblock: null
};

export default memo(BlockedItem);
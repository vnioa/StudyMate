// features/social/screens/chat/ChatSettingsScreen/components/NotificationSettings.js
import React, { memo, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles';

const NotificationSettings = ({
                                  isMuted,
                                  isPinned,
                                  onToggleMute,
                                  onTogglePin,
                                  customSound,
                                  onCustomSoundPress
                              }) => {
    // 알림 설정 변경 처리
    const handleMuteToggle = useCallback(() => {
        onToggleMute?.();
    }, [onToggleMute]);

    // 고정 설정 변경 처리
    const handlePinToggle = useCallback(() => {
        onTogglePin?.();
    }, [onTogglePin]);

    return (
        <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>알림 설정</Text>

            <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                    <Ionicons
                        name={isMuted ? "notifications-off" : "notifications"}
                        size={24}
                        color={isMuted ? "#8E8E93" : "#000"}
                    />
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>
                            채팅방 알림
                        </Text>
                        <Text style={styles.settingDescription}>
                            {isMuted ? '알림이 꺼져있습니다' : '알림이 켜져있습니다'}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={!isMuted}
                    onValueChange={handleMuteToggle}
                    trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#D1D1D6"
                />
            </View>

            <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                    <Ionicons
                        name="pin"
                        size={24}
                        color={isPinned ? "#0057D9" : "#8E8E93"}
                    />
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTitle}>
                            채팅방 고정
                        </Text>
                        <Text style={styles.settingDescription}>
                            {isPinned ? '목록 상단에 고정됩니다' : '목록에서 일반적으로 표시됩니다'}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={isPinned}
                    onValueChange={handlePinToggle}
                    trackColor={{ false: '#D1D1D6', true: '#0057D9' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#D1D1D6"
                />
            </View>

            {onCustomSoundPress && (
                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={onCustomSoundPress}
                >
                    <View style={styles.settingInfo}>
                        <Ionicons name="musical-note" size={24} color="#000" />
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingTitle}>
                                알림음
                            </Text>
                            <Text style={styles.settingDescription}>
                                {customSound || '기본 알림음'}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#8E8E93" />
                </TouchableOpacity>
            )}
        </View>
    );
};

NotificationSettings.defaultProps = {
    isMuted: false,
    isPinned: false,
    onToggleMute: null,
    onTogglePin: null,
    customSound: null,
    onCustomSoundPress: null
};

export default memo(NotificationSettings);
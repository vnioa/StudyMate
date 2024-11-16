// features/social/screens/friend/FriendManageScreen/components/ManageActions.js
import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

const ManageActions = ({
                           selectedCount,
                           onUnblock,
                           onRemove,
                           style
                       }) => {
    const insets = useSafeAreaInsets();

    // 버튼 활성화 상태
    const isActionsEnabled = useMemo(() => selectedCount > 0, [selectedCount]);

    // 버튼 스타일
    const buttonStyle = useMemo(() => ({
        ...styles.actionButton,
        opacity: isActionsEnabled ? 1 : 0.5
    }), [isActionsEnabled]);

    return (
        <View
            style={[
                styles.actionsContainer,
                { paddingBottom: Math.max(insets.bottom, 16) },
                Platform.OS === 'ios' && styles.actionsContainerIOS,
                style
            ]}
        >
            <View style={styles.actionsContent}>
                <TouchableOpacity
                    style={[buttonStyle, styles.unblockButton]}
                    onPress={onUnblock}
                    disabled={!isActionsEnabled}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="person-add-outline"
                        size={24}
                        color="#FFFFFF"
                        style={styles.actionIcon}
                    />
                    <Text style={styles.actionText}>
                        차단 해제 {selectedCount > 0 && `(${selectedCount})`}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[buttonStyle, styles.removeButton]}
                    onPress={onRemove}
                    disabled={!isActionsEnabled}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="person-remove-outline"
                        size={24}
                        color="#FFFFFF"
                        style={styles.actionIcon}
                    />
                    <Text style={styles.actionText}>
                        친구 삭제 {selectedCount > 0 && `(${selectedCount})`}
                    </Text>
                </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && (
                <View
                    style={[
                        styles.actionsShadow,
                        { height: Math.max(insets.bottom + 20, 40) }
                    ]}
                />
            )}
        </View>
    );
};

ManageActions.defaultProps = {
    selectedCount: 0,
    onUnblock: null,
    onRemove: null
};

export default memo(ManageActions);
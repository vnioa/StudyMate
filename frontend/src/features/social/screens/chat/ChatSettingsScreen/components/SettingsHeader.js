// features/social/screens/chat/ChatSettingsScreen/components/SettingsHeader.js
import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

const SettingsHeader = ({
                            title,
                            onBack,
                            isEditing,
                            onEditPress,
                            loading
                        }) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.headerContainer,
                { paddingTop: insets.top }
            ]}
        >
            <TouchableOpacity
                style={styles.headerButton}
                onPress={onBack}
                disabled={loading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons
                    name="chevron-back"
                    size={28}
                    color={loading ? "#8E8E93" : "#000000"}
                />
            </TouchableOpacity>

            <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
            </Text>

            <TouchableOpacity
                style={styles.headerButton}
                onPress={onEditPress}
                disabled={loading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons
                    name={isEditing ? "checkmark" : "pencil"}
                    size={24}
                    color={loading ? "#8E8E93" : isEditing ? "#0057D9" : "#000000"}
                />
            </TouchableOpacity>
        </View>
    );
};

SettingsHeader.defaultProps = {
    title: '설정',
    isEditing: false,
    loading: false,
    onBack: null,
    onEditPress: null
};

export default memo(SettingsHeader);
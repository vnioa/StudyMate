// features/social/screens/friend/FriendListScreen/components/AddFriendButton.js
import React, { memo } from 'react';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

const AddFriendButton = ({ onPress, loading }) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.addButtonContainer,
                { paddingBottom: Math.max(insets.bottom, 16) }
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.addButton,
                    loading && styles.addButtonDisabled
                ]}
                onPress={onPress}
                disabled={loading}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="person-add"
                    size={24}
                    color="#FFFFFF"
                    style={styles.addButtonIcon}
                />
                <Text style={styles.addButtonText}>
                    친구 추가
                </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
                <View
                    style={[
                        styles.addButtonShadow,
                        { bottom: Math.max(insets.bottom, 16) }
                    ]}
                />
            )}
        </View>
    );
};

AddFriendButton.defaultProps = {
    loading: false,
    onPress: () => {}
};

export default memo(AddFriendButton);
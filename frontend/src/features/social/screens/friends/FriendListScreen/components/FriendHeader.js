// features/social/screens/friend/FriendListScreen/components/FriendHeader.js
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

const FriendHeader = ({
                          totalCount,
                          onlineCount,
                          onSettingsPress,
                          onSortPress,
                          sortType = 'name'  // 'name' | 'recent' | 'online'
                      }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // 정렬 방식 변경
    const handleSortPress = useCallback(() => {
        const sortOptions = [
            { label: '이름순', value: 'name' },
            { label: '최근 접속순', value: 'recent' },
            { label: '온라인순', value: 'online' }
        ];

        const currentIndex = sortOptions.findIndex(option => option.value === sortType);
        const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
        onSortPress?.(nextSort.value);
    }, [sortType, onSortPress]);

    // 설정 화면으로 이동
    const handleSettingsPress = useCallback(() => {
        if (onSettingsPress) {
            onSettingsPress();
        } else {
            navigation.navigate('FriendSettings');
        }
    }, [navigation, onSettingsPress]);

    // 정렬 방식에 따른 아이콘
    const getSortIcon = () => {
        switch (sortType) {
            case 'recent':
                return 'time-outline';
            case 'online':
                return 'people-outline';
            default:
                return 'text-outline';
        }
    };

    return (
        <View
            style={[
                styles.headerContainer,
                { paddingTop: insets.top + 8 }
            ]}
        >
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>친구</Text>
                <View style={styles.headerCountContainer}>
                    <Text style={styles.headerCount}>
                        {totalCount || 0}
                    </Text>
                    {onlineCount > 0 && (
                        <Text style={styles.headerOnlineCount}>
                            • {onlineCount}명 접속 중
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.headerActions}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleSortPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={getSortIcon()}
                        size={24}
                        color="#000000"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.headerButton, styles.headerButtonLast]}
                    onPress={handleSettingsPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="settings-outline"
                        size={24}
                        color="#000000"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

FriendHeader.defaultProps = {
    totalCount: 0,
    onlineCount: 0,
    sortType: 'name',
    onSettingsPress: null,
    onSortPress: null
};

export default memo(FriendHeader);
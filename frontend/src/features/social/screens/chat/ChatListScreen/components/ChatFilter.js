// features/social/screens/chat/ChatListScreen/components/ChatFilter.js
import React, { memo } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles';

const FILTER_OPTIONS = [
    {
        id: 'all',
        label: '전체',
        icon: 'chatbubbles-outline',
    },
    {
        id: 'personal',
        label: '개인',
        icon: 'person-outline',
    },
    {
        id: 'group',
        label: '그룹',
        icon: 'people-outline',
    },
    {
        id: 'unread',
        label: '안 읽음',
        icon: 'mail-unread-outline',
    },
    {
        id: 'pinned',
        label: '고정됨',
        icon: 'pin-outline',
    },
    {
        id: 'archived',
        label: '보관됨',
        icon: 'archive-outline',
    }
];

const ChatFilter = ({ selectedFilter, onFilterChange, unreadCount }) => {
    const handleFilterChange = (filterId) => {
        if (onFilterChange) {
            onFilterChange(filterId);
        }
    };

    const renderFilterButton = (option) => {
        const isActive = selectedFilter === option.id;

        return (
            <TouchableOpacity
                key={option.id}
                style={[
                    styles.filterButton,
                    isActive && styles.filterButtonActive,
                ]}
                onPress={() => handleFilterChange(option.id)}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={option.icon}
                    size={20}
                    color={isActive ? '#0057D9' : '#666666'}
                />
                <Text
                    style={[
                        styles.filterText,
                        isActive && styles.filterTextActive,
                    ]}
                >
                    {option.label}
                </Text>
                {option.id === 'unread' && unreadCount > 0 && (
                    <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.filterWrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
                bounces={false}
            >
                {FILTER_OPTIONS.map(renderFilterButton)}
            </ScrollView>
        </View>
    );
};

ChatFilter.defaultProps = {
    selectedFilter: 'all',
    onFilterChange: null,
    unreadCount: 0
};

export default memo(ChatFilter);
import React, { memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Platform
} from 'react-native';

const SegmentedControl = memo(({ selectedTab, onTabChange, slideAnimation, unreadCount }) => {
    const translateX = slideAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 150]  // 탭 너비에 맞게 조정
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.slider,
                    { transform: [{ translateX }] }
                ]}
            />
            <TouchableOpacity
                style={styles.tab}
                onPress={() => onTabChange('chats')}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.tabText,
                    selectedTab === 'chats' && styles.activeTabText
                ]}>
                    채팅
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tab}
                onPress={() => onTabChange('friends')}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.tabText,
                    selectedTab === 'friends' && styles.activeTabText
                ]}>
                    친구
                </Text>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        position: 'relative',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 4,
        height: 44,
        width: 300,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    slider: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: 4,
        width: '47%',
        height: 36,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666666',
        textAlign: 'center',
    },
    activeTabText: {
        color: '#0066FF',
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -16,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    }
});

SegmentedControl.displayName = 'SegmentedControl';

export default SegmentedControl;
// features/social/screens/friend/FriendManageScreen/components/ManageHeader.js
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';

const ManageHeader = ({
                          title,
                          selectedCount,
                          totalCount,
                          isEditing,
                          onBack,
                          onEditPress,
                          onSelectAll
                      }) => {
    const insets = useSafeAreaInsets();

    // 선택 상태 텍스트
    const getSelectionText = useCallback(() => {
        if (!isEditing) return null;
        if (selectedCount === 0) return '선택하기';
        return `${selectedCount}/${totalCount}명 선택됨`;
    }, [isEditing, selectedCount, totalCount]);

    // 전체 선택 버튼 상태
    const isAllSelected = useCallback(() => {
        return selectedCount === totalCount && totalCount > 0;
    }, [selectedCount, totalCount]);

    return (
        <View
            style={[
                styles.headerContainer,
                { paddingTop: insets.top }
            ]}
        >
            {/* 왼쪽: 뒤로가기 버튼 */}
            <TouchableOpacity
                style={styles.headerButton}
                onPress={onBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons
                    name="chevron-back"
                    size={28}
                    color="#000000"
                />
            </TouchableOpacity>

            {/* 중앙: 타이틀과 선택 정보 */}
            <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>
                    {title}
                </Text>
                {isEditing && (
                    <Text style={styles.headerSubtitle}>
                        {getSelectionText()}
                    </Text>
                )}
            </View>

            {/* 오른쪽: 편집/전체선택 버튼 */}
            <View style={styles.headerRight}>
                {isEditing && totalCount > 0 && (
                    <TouchableOpacity
                        style={[styles.headerButton, styles.headerButtonMargin]}
                        onPress={onSelectAll}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={isAllSelected() ? "checkbox" : "square-outline"}
                            size={24}
                            color={isAllSelected() ? "#0057D9" : "#8E8E93"}
                        />
                    </TouchableOpacity>
                )}
                {totalCount > 0 && (
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={onEditPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text
                            style={[
                                styles.headerButtonText,
                                isEditing && styles.headerButtonTextActive
                            ]}
                        >
                            {isEditing ? '완료' : '편집'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

ManageHeader.defaultProps = {
    title: '친구 관리',
    selectedCount: 0,
    totalCount: 0,
    isEditing: false,
    onBack: null,
    onEditPress: null,
    onSelectAll: null
};

export default memo(ManageHeader);
// features/social/screens/friend/FriendManageScreen/index.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFriend } from '../../../hooks/useFriend';
import ManageHeader from './components/ManageHeader';
import BlockedList from './components/BlockedList';
import ManageActions from './components/ManageActions';
import ConfirmDialog from './components/ConfirmDialog';
import styles from './styles';

const FriendManageScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const {
        blocked,
        loading,
        error,
        unblockFriend,
        removeFriend,
        refresh,
        isRefreshing
    } = useFriend();

    // 선택 모드 전환
    const handleEditPress = useCallback(() => {
        setIsEditing(!isEditing);
        setSelectedUsers([]);
    }, [isEditing]);

    // 사용자 선택
    const handleSelectUser = useCallback((userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            }
            return [...prev, userId];
        });
    }, []);

    // 전체 선택
    const handleSelectAll = useCallback(() => {
        if (selectedUsers.length === blocked.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(blocked.map(user => user.id));
        }
    }, [blocked, selectedUsers.length]);

    // 차단 해제
    const handleUnblock = useCallback(async (userIds) => {
        try {
            await Promise.all(userIds.map(id => unblockFriend(id)));
            Alert.alert('알림', '선택한 사용자의 차단이 해제되었습니다.');
            setSelectedUsers([]);
            setIsEditing(false);
        } catch (err) {
            Alert.alert('오류', '차단 해제에 실패했습니다.');
        }
    }, [unblockFriend]);

    // 확인 다이얼로그 표시
    const showConfirmDialog = useCallback((action, message) => {
        setConfirmAction({ action, message });
        setShowConfirm(true);
    }, []);

    // 액션 실행
    const handleAction = useCallback((action) => {
        if (selectedUsers.length === 0) {
            Alert.alert('알림', '선택된 사용자가 없습니다.');
            return;
        }

        switch (action) {
            case 'unblock':
                showConfirmDialog(
                    () => handleUnblock(selectedUsers),
                    '선택한 사용자의 차단을 해제하시겠습니까?'
                );
                break;
            case 'remove':
                showConfirmDialog(
                    () => removeFriend(selectedUsers),
                    '선택한 사용자를 친구 목록에서 삭제하시겠습니까?'
                );
                break;
            default:
                break;
        }
    }, [selectedUsers, showConfirmDialog, handleUnblock, removeFriend]);

    // 에러 처리
    useEffect(() => {
        if (error) {
            Alert.alert('오류', error);
        }
    }, [error]);

    return (
        <View
            style={[
                styles.container,
                { paddingTop: insets.top }
            ]}
        >
            <ManageHeader
                title="친구 관리"
                selectedCount={selectedUsers.length}
                totalCount={blocked.length}
                isEditing={isEditing}
                onBack={() => navigation.goBack()}
                onEditPress={handleEditPress}
                onSelectAll={handleSelectAll}
            />

            <BlockedList
                data={blocked}
                selectedUsers={selectedUsers}
                isEditing={isEditing}
                onSelect={handleSelectUser}
                onUnblock={handleUnblock}
                loading={loading}
                onRefresh={refresh}
                refreshing={isRefreshing}
            />

            {isEditing && (
                <ManageActions
                    style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                    selectedCount={selectedUsers.length}
                    onUnblock={() => handleAction('unblock')}
                    onRemove={() => handleAction('remove')}
                />
            )}

            <ConfirmDialog
                visible={showConfirm}
                message={confirmAction?.message}
                onConfirm={() => {
                    setShowConfirm(false);
                    confirmAction?.action();
                }}
                onCancel={() => setShowConfirm(false)}
            />
        </View>
    );
};

export default FriendManageScreen;
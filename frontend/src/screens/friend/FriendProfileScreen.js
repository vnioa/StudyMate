import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    Alert,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { friendAPI } from '../../services/api';

const FriendProfileScreen = ({ route, navigation }) => {
    const { friendId } = route.params;
    const [loading, setLoading] = useState(false);
    const [friend, setFriend] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [commonGroups, setCommonGroups] = useState([]);

    useEffect(() => {
        fetchFriendProfile();
    }, [friendId]);

    const fetchFriendProfile = async () => {
        try {
            setLoading(true);
            const response = await friendAPI.getFriendProfile(friendId);
            setFriend(response.data.friend);
            setIsBlocked(response.data.isBlocked);
            setIsHidden(response.data.isHidden);
            setCommonGroups(response.data.commonGroups);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '프로필을 불러오는데 실패했습니다.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async () => {
        try {
            setLoading(true);
            const response = await friendAPI.toggleBlock(friendId);
            setIsBlocked(response.data.isBlocked);
            Alert.alert('알림', isBlocked ? '차단이 해제되었습니다.' : '차단되었습니다.');
        } catch (error) {
            Alert.alert('오류', '작업을 처리하는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleHide = async () => {
        try {
            setLoading(true);
            const response = await friendAPI.toggleHide(friendId);
            setIsHidden(response.data.isHidden);
            Alert.alert('알림', isHidden ? '숨김이 해제되었습니다.' : '숨김 처리되었습니다.');
        } catch (error) {
            Alert.alert('오류', '작업을 처리하는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFriend = () => {
        Alert.alert(
            '친구 삭제',
            '정말로 이 친구를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await friendAPI.deleteFriend(friendId);
                            Alert.alert('알림', '친구가 삭제되었습니다.', [
                                { text: '확인', onPress: () => navigation.goBack() }
                            ]);
                        } catch (error) {
                            Alert.alert('오류', '친구 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const handleStartChat = async () => {
        try {
            const response = await friendAPI.startChat(friendId);
            navigation.navigate('ChatRoom', {
                roomId: response.data.roomId,
                roomName: friend.name
            });
        } catch (error) {
            Alert.alert('오류', '채팅을 시작할 수 없습니다.');
        }
    };

    if (loading && !friend) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
            </View>
        );
    }

    // JSX는 기존과 동일하되 다음과 같이 이벤트 핸들러 추가
    return (
        <View style={styles.container}>
            {/* 기존 JSX와 동일하나 이벤트 핸들러 연결 */}
            <Pressable
                style={styles.chatButton}
                onPress={handleStartChat}
                disabled={loading}
            >
                <Icon name="message-circle" size={24} color="#fff" />
                <Text style={styles.chatButtonText}>채팅하기</Text>
            </Pressable>

            <View style={styles.settingsSection}>
                <Pressable
                    style={styles.settingItem}
                    onPress={handleBlock}
                    disabled={loading}
                >
                    {/* 기존 차단 버튼 JSX */}
                </Pressable>
                {/* 나머지 설정 버튼들도 동일하게 핸들러 연결 */}
            </View>
        </View>
    );
};

// styles는 기존과 동일하되 loadingContainer 추가
const additionalStyles = {
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    }
};

export default FriendProfileScreen;
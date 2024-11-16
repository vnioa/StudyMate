// features/social/screens/friend/FriendListScreen/index.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import FriendHeader from './components/FriendHeader';
import FriendList from './components/FriendList';
import FriendSearch from './components/FriendSearch';
import AddFriendButton from './components/AddFriendButton';
import {
    fetchFriends,
    searchFriends,
    addFriend,
    removeFriend,
    blockFriend,
    selectFriends,
    selectLoading,
    selectError
} from '../../../store/slices/friendSlice';
import styles from './styles';

const FriendListScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [sortType, setSortType] = useState('name');

    const friends = useSelector(selectFriends);
    const loading = useSelector(selectLoading);
    const error = useSelector(selectError);

    // 친구 목록 조회
    const loadFriends = useCallback(async () => {
        try {
            await dispatch(fetchFriends()).unwrap();
        } catch (err) {
            Alert.alert('오류', '친구 목록을 불러오는데 실패했습니다.');
        }
    }, [dispatch]);

    // 초기 데이터 로드
    useEffect(() => {
        loadFriends();
    }, [loadFriends]);

    // 정렬 방식 변경 처리
    const handleSortPress = useCallback((newSortType) => {
        setSortType(newSortType);
        // 정렬된 친구 목록 업데이트
        const sortedFriends = [...friends].sort((a, b) => {
            switch (newSortType) {
                case 'recent':
                    return new Date(b.lastActive) - new Date(a.lastActive);
                case 'online':
                    return b.isOnline - a.isOnline;
                default: // 'name'
                    return a.name.localeCompare(b.name, 'ko-KR');
            }
        });
        dispatch(setFriends(sortedFriends));
    }, [friends, dispatch]);

    // 새로고침
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadFriends();
        } finally {
            setRefreshing(false);
        }
    }, [loadFriends]);

    // 검색
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        dispatch(searchFriends(query));
    }, [dispatch]);

    // 친구 추가
    const handleAddFriend = useCallback(async (userId) => {
        try {
            await dispatch(addFriend(userId)).unwrap();
            Alert.alert('알림', '친구가 추가되었습니다.');
        } catch (err) {
            Alert.alert('오류', '친구 추가에 실패했습니다.');
        }
    }, [dispatch]);

    // 친구 삭제
    const handleRemoveFriend = useCallback((friendId) => {
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
                            await dispatch(removeFriend(friendId)).unwrap();
                            Alert.alert('알림', '친구가 삭제되었습니다.');
                        } catch (err) {
                            Alert.alert('오류', '친구 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    }, [dispatch]);

    // 친구 차단
    const handleBlockFriend = useCallback((friendId) => {
        Alert.alert(
            '친구 차단',
            '이 친구를 차단하시겠습니까?\n차단된 친구는 메시지를 보낼 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '차단',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(blockFriend(friendId)).unwrap();
                            Alert.alert('알림', '친구가 차단되었습니다.');
                        } catch (err) {
                            Alert.alert('오류', '친구 차단에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    }, [dispatch]);

    // 친구 프로필로 이동
    const handleFriendPress = useCallback((friendId) => {
        navigation.navigate('FriendProfile', { friendId });
    }, [navigation]);

    // 친구 추가 화면으로 이동
    const handleAddFriendPress = useCallback(() => {
        navigation.navigate('AddFriend');
    }, [navigation]);

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>친구 목록을 불러오는데 실패했습니다.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FriendHeader
                totalCount={friends.length}
                onlineCount={friends.filter(f => f.isOnline).length}
                sortType={sortType}
                onSortPress={handleSortPress}
            />
            <FriendSearch
                value={searchQuery}
                onChangeText={handleSearch}
                onClear={() => handleSearch('')}
            />
            <FriendList
                data={friends}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onFriendPress={handleFriendPress}
                onRemoveFriend={handleRemoveFriend}
                onBlockFriend={handleBlockFriend}
                loading={loading}
            />
            <AddFriendButton onPress={handleAddFriendPress} />
        </View>
    );
};

export default FriendListScreen;
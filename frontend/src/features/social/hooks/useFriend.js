// features/social/hooks/useFriend.js
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchFriends,
    addFriend,
    removeFriend,
    blockFriend,
    unblockFriend,
    searchFriends,
    setSearchResults,
    clearSearchResults,
    setLoading,
    setError,
    setRefreshing,
    setSuggestions,
    resetFriendState,
    selectFriends,
    selectBlocked,
    selectSearchResults,
    selectLoading,
    selectError,
    selectIsRefreshing,
    selectLastUpdated,
    selectSuggestions,
    selectSearchLoading,
    selectSearchError
} from '../store/slices/friendSlice';

export const useFriend = () => {
    const dispatch = useDispatch();

    // 선택자를 사용하여 상태 조회
    const friends = useSelector(selectFriends);
    const blocked = useSelector(selectBlocked);
    const searchResults = useSelector(selectSearchResults);
    const suggestions = useSelector(selectSuggestions);
    const loading = useSelector(selectLoading);
    const error = useSelector(selectError);
    const isRefreshing = useSelector(selectIsRefreshing);
    const searchLoading = useSelector(selectSearchLoading);
    const searchError = useSelector(selectSearchError);
    const lastUpdated = useSelector(selectLastUpdated);

    // 친구 목록 조회
    const loadFriends = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch(setLoading(true));
            }
            await dispatch(fetchFriends()).unwrap();
        } catch (err) {
            dispatch(setError(err.message || '친구 목록을 불러오는데 실패했습니다.'));
            console.error('Friend Load Error:', err);
        } finally {
            if (showLoading) {
                dispatch(setLoading(false));
            }
        }
    }, [dispatch]);

    // 친구 추천 목록 로드
    const loadSuggestions = useCallback(async () => {
        try {
            const suggestions = await friendService.getFriendSuggestions();
            dispatch(setSuggestions(suggestions));
        } catch (err) {
            console.error('Suggestions Load Error:', err);
        }
    }, [dispatch]);

    // 새로고침
    const refresh = useCallback(async () => {
        dispatch(setRefreshing(true));
        try {
            await Promise.all([
                loadFriends(false),
                loadSuggestions()
            ]);
        } finally {
            dispatch(setRefreshing(false));
        }
    }, [dispatch, loadFriends, loadSuggestions]);

    // 친구 검색
    const searchFriendUsers = useCallback(async (query) => {
        if (!query.trim()) {
            dispatch(clearSearchResults());
            return;
        }
        try {
            const results = await dispatch(searchFriends(query)).unwrap();
            dispatch(setSearchResults(results));
        } catch (err) {
            console.error('Friend Search Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 친구 추가
    const handleAddFriend = useCallback(async (userId) => {
        try {
            const result = await dispatch(addFriend(userId)).unwrap();
            // 추천 목록에서 제거
            const updatedSuggestions = suggestions.filter(s => s.id !== userId);
            dispatch(setSuggestions(updatedSuggestions));
            return result;
        } catch (err) {
            console.error('Add Friend Error:', err);
            throw err;
        }
    }, [dispatch, suggestions]);

    // 친구 삭제
    const handleRemoveFriend = useCallback(async (friendId) => {
        try {
            await dispatch(removeFriend(friendId)).unwrap();
            return true;
        } catch (err) {
            console.error('Remove Friend Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 친구 차단
    const handleBlockFriend = useCallback(async (friendId) => {
        try {
            const result = await dispatch(blockFriend(friendId)).unwrap();
            return result;
        } catch (err) {
            console.error('Block Friend Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 차단 해제
    const handleUnblockFriend = useCallback(async (userId) => {
        try {
            await dispatch(unblockFriend(userId)).unwrap();
            return true;
        } catch (err) {
            console.error('Unblock Friend Error:', err);
            throw err;
        }
    }, [dispatch]);

    // 검색 결과 초기화
    const clearSearch = useCallback(() => {
        dispatch(clearSearchResults());
    }, [dispatch]);

    // 초기 데이터 로드
    useEffect(() => {
        loadFriends();
        loadSuggestions();
        return () => {
            dispatch(resetFriendState());
        };
    }, [loadFriends, loadSuggestions, dispatch]);

    // 주기적인 데이터 갱신 (5분마다)
    useEffect(() => {
        const intervalId = setInterval(() => {
            loadFriends(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [loadFriends]);

    return {
        // 데이터
        friends,
        blocked,
        searchResults,
        suggestions,
        lastUpdated,

        // 상태
        loading,
        error,
        isRefreshing,
        searchLoading,
        searchError,

        // 액션
        refresh,
        searchFriends: searchFriendUsers,
        clearSearch,
        addFriend: handleAddFriend,
        removeFriend: handleRemoveFriend,
        blockFriend: handleBlockFriend,
        unblockFriend: handleUnblockFriend,
        loadSuggestions,

        // 유틸리티
        isFriend: useCallback((userId) =>
            friends.some(friend => friend.id === userId), [friends]),
        isBlocked: useCallback((userId) =>
            blocked.some(user => user.id === userId), [blocked])
    };
};

export default useFriend;
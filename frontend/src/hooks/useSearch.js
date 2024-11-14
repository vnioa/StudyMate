// src/hooks/useSearch.js

import { useState, useCallback } from 'react';
import { searchFriends, searchMessages } from '../api/searchAPI';

const useSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 검색 수행
    const executeSearch = useCallback(
        async (searchType = 'friends') => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                let data;
                if (searchType === 'friends') {
                    data = await searchFriends(query);
                } else if (searchType === 'messages') {
                    data = await searchMessages(query);
                }
                setResults(data);
            } catch (err) {
                setError('Failed to fetch search results');
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        },
        [query]
    );

    // 쿼리 업데이트
    const updateQuery = useCallback((newQuery) => {
        setQuery(newQuery);
    }, []);

    // 검색 결과 초기화
    const clearResults = useCallback(() => {
        setResults([]);
        setQuery('');
    }, []);

    return {
        query,
        results,
        loading,
        error,
        executeSearch,
        updateQuery,
        clearResults,
    };
};

export default useSearch;

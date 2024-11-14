// 채팅 내 첨부 파일 검색 기능

import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import { searchFilesInChat } from '../../api/chat';

const FileSearch = ({ chatId }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async () => {
        try {
            const files = await searchFilesInChat(chatId, query);
            setResults(files);
        } catch (error) {
            console.error('파일 검색 실패:', error);
        }
    };

    return (
        <View>
            <TextInput
                placeholder="검색어 입력"
                value={query}
                onChangeText={setQuery}
                style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
            />
            <Button title="파일 검색" onPress={handleSearch} />
            <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <Text>{item.name}</Text>}
            />
        </View>
    );
};

export default FileSearch;

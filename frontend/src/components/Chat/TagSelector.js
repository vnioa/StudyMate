// src/components/Chat/TagSelector.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const TagSelector = ({ availableTags, onTagSelect }) => {
    const [selectedTags, setSelectedTags] = useState([]);
    const [newTag, setNewTag] = useState('');

    // 태그 추가
    const addTag = (tag) => {
        if (selectedTags.includes(tag)) return;
        setSelectedTags([...selectedTags, tag]);
        onTagSelect([...selectedTags, tag]);
    };

    // 새로운 태그 추가
    const handleAddNewTag = () => {
        if (newTag.trim() && !selectedTags.includes(newTag)) {
            addTag(newTag.trim());
            setNewTag('');
        }
    };

    // 태그 제거
    const removeTag = (tag) => {
        const updatedTags = selectedTags.filter((t) => t !== tag);
        setSelectedTags(updatedTags);
        onTagSelect(updatedTags);
    };

    const renderTag = ({ item }) => (
        <TouchableOpacity onPress={() => addTag(item)} style={styles.tagButton}>
            <Text style={styles.tagButtonText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select Tags</Text>
            <FlatList
                data={availableTags}
                renderItem={renderTag}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tagList}
            />

            <View style={styles.selectedTagsContainer}>
                {selectedTags.map((tag) => (
                    <View key={tag} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag)}>
                            <Text style={styles.removeTagText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <View style={styles.newTagContainer}>
                <TextInput
                    style={styles.newTagInput}
                    placeholder="Add new tag"
                    value={newTag}
                    onChangeText={setNewTag}
                />
                <TouchableOpacity onPress={handleAddNewTag} style={styles.addTagButton}>
                    <Text style={styles.addTagButtonText}>Add</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    tagList: {
        marginBottom: 10,
    },
    tagButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
        marginRight: 8,
    },
    tagButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    selectedTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginRight: 8,
        marginBottom: 5,
    },
    selectedTagText: {
        color: '#fff',
        fontSize: 14,
        marginRight: 5,
    },
    removeTagText: {
        color: '#fff',
        fontSize: 12,
    },
    newTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    newTagInput: {
        flex: 1,
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 8,
        borderRadius: 5,
        marginRight: 8,
    },
    addTagButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#28a745',
        borderRadius: 5,
    },
    addTagButtonText: {
        color: '#fff',
        fontSize: 14,
    },
});

export default TagSelector;

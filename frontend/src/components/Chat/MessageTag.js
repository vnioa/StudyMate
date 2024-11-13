// components/MessageTag.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const MessageTag = ({ onAddTag }) => {
    const [tag, setTag] = useState('');

    const addTag = () => {
        if (tag.trim()) {
            onAddTag(tag);
            setTag('');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Add Tag:</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter tag"
                value={tag}
                onChangeText={setTag}
            />
            <Button title="Add Tag" onPress={addTag} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    label: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        borderBottomWidth: 1,
        marginRight: 10,
    },
});

export default MessageTag;

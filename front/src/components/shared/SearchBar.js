import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ value, onChangeText, placeholder, onSubmit }) => {
    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color="#8E8E93"
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder || "검색"}
                    placeholderTextColor="#8E8E93"
                    returnKeyType="search"
                    onSubmitEditing={onSubmit}
                    clearButtonMode="while-editing"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {value.length > 0 && (
                    <TouchableOpacity
                        onPress={() => onChangeText('')}
                        style={styles.clearButton}
                    >
                        <Ionicons name="close-circle" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 36
    },
    searchIcon: {
        marginRight: 8
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        padding: 0,
        height: '100%'
    },
    clearButton: {
        padding: 4,
        marginLeft: 8
    }
});

export default SearchBar;
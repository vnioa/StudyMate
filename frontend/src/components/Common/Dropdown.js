// src/components/Common/Dropdown.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const Dropdown = ({ options, onSelect, placeholder = 'Select an option', selectedValue, style }) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleSelect = (item) => {
        onSelect(item);
        setIsVisible(false);
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity onPress={() => setIsVisible(true)} style={styles.dropdown}>
                <Text style={styles.selectedText}>
                    {selectedValue ? selectedValue.label : placeholder}
                </Text>
                <FontAwesome name="caret-down" size={16} color="#555" />
            </TouchableOpacity>

            <Modal transparent visible={isVisible} animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsVisible(false)} />
                <View style={styles.modalContent}>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item.value.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)}>
                                <Text style={styles.optionText}>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    selectedText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        position: 'absolute',
        top: '40%',
        left: '10%',
        right: '10%',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 10,
        maxHeight: 200,
    },
    option: {
        padding: 12,
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
});

export default Dropdown;

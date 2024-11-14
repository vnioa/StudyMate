// src/components/Chat/MultiViewToggle.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MultiViewToggle = ({ onToggle }) => {
    const [isMultiView, setIsMultiView] = useState(false);

    // 토글 버튼 클릭 시 멀티 뷰 모드를 전환
    const handleToggle = () => {
        const newMultiViewState = !isMultiView;
        setIsMultiView(newMultiViewState);
        onToggle(newMultiViewState); // 부모 컴포넌트에 상태 전달
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleToggle} style={styles.button}>
                <Text style={styles.buttonText}>{isMultiView ? 'Exit Multi-View' : 'Enter Multi-View'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007bff',
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default MultiViewToggle;

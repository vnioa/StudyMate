import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const TabSelector = ({ isIdTab, onTabChange }) => {
    return (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tabButton, isIdTab && styles.activeTab]}
                onPress={() => onTabChange(true)}
            >
                <Text style={[styles.tabText, isIdTab && styles.activeTabText]}>
                    아이디 찾기
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tabButton, !isIdTab && styles.activeTab]}
                onPress={() => onTabChange(false)}
            >
                <Text style={[styles.tabText, !isIdTab && styles.activeTabText]}>
                    비밀번호 찾기
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#ddd'
    },
    activeTab: {
        borderBottomColor: '#0057D9'
    },
    tabText: {
        fontSize: 16,
        color: '#888'
    },
    activeTabText: {
        color: '#0057D9',
        fontWeight: 'bold'
    }
});

export default TabSelector;
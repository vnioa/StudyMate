// src/screens/group/GroupActivityScreen.js
//VB
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GroupActivityScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 활동</Text>
            </View>
            <View style={styles.activitySection}>
                <Text style={styles.sectionTitle}>최근 활동</Text>
                <View style={styles.activityItem}>
                    <Image
                        source={{ uri: '' }} // Thay bằng URL hình ảnh của bạn
                        style={styles.activityImage}
                    />
                    <View style={styles.activityInfo}>
                        <Text style={styles.activityName}>선문대학교</Text>
                        <Text style={styles.activityTime}>1h</Text>
                        <Text style={styles.activityDescription}>
                            선문대 학교 그룹 10월 이벤트 공유
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    activitySection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    activityImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    activityInfo: {
        flex: 1,
    },
    activityName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    activityTime: {
        fontSize: 14,
        color: '#888',
    },
    activityDescription: {
        fontSize: 14,
        color: '#333',
    },
});

export default GroupActivityScreen;
//VB
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AIGroupMatchingScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>AI 기반 그룹 매칭</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={styles.recommendationSection}>
                <Text style={styles.sectionTitle}>추천 그룹</Text>
                <View style={styles.groupItem}>
                    <Image
                        source={{ uri: '' }} // Thay bằng URL hình ảnh của bạn
                        style={styles.groupImage}
                    />
                    <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>선문대학교 중앙 도서관</Text>
                        <Text style={styles.groupDetails}>1K members, 8 new posts</Text>
                        <Text style={styles.groupDescription}>
                            선문대학교 중앙도서관 그룹입니다.
                        </Text>
                    </View>
                </View>
                <View style={styles.buttons}>
                    <TouchableOpacity style={styles.joinButton}>
                        <Text style={styles.buttonText}>가입</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareButton}>
                        <Text style={styles.buttonText}>공유</Text>
                    </TouchableOpacity>
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
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    iconButton: {
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    recommendationSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    groupImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    groupDetails: {
        fontSize: 14,
        color: '#888',
    },
    groupDescription: {
        fontSize: 14,
        color: '#333',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    joinButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 5,
    },
    shareButton: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default AIGroupMatchingScreen; 
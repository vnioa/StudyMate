// src/screens/group/GroupSettingsScreen.js
//VB 그룹 설정 화면

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GroupSettingsScreen = ({ navigation }) => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>그룹 설정</Text>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>카테고리</Text>
                <View style={styles.categoryContainer}>
                    {['교육 및 학습', '사회 및 인간관계', '생활 및 취미', '여행 및 문화', '경제 및 재정'].map((category, index) => (
                        <Text key={index} style={styles.categoryItem}>{category}</Text>
                    ))}
                </View>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>목표 설정</Text>
                {[
                    { title: '10월 목표', description: '모바일 프로젝트 1차적으로 완성함' },
                    { title: '2024년 2학기', description: '좋은 학점 받기' }
                ].map((goal, index) => (
                    <TouchableOpacity key={index} style={styles.goalItem}>
                        <Image
                            source={{ uri: '' }} // Thay bằng URL hình ảnh của bạn
                            style={styles.goalImage}
                        />
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalTitle}>{goal.title}</Text>
                            <Text style={styles.goalDescription}>{goal.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>인원 제한</Text>
                <Text style={styles.text}>없음</Text>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>아이콘 및 배너 이미지</Text>
                <Text style={styles.text}>아니콘 설정</Text>
                <Text style={styles.text}>배너 이미지 설정</Text>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>그룹 규칙</Text>
                <Text style={styles.text}>
                    모든 멤버는 서로를 존중해야 합니다. 비난, 모욕, 차별적인 발언은 금지됩니다.
                </Text>
                <Text style={styles.text}>
                    욕설, 공격적인 언어, 또는 불쾌감을 줄 수 있는 표현은 삼가야 합니다.
                </Text>
            </View>
        </ScrollView>
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
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryItem: {
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    goalImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    goalInfo: {
        flex: 1,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    goalDescription: {
        fontSize: 14,
        color: '#888',
    },
    text: {
        fontSize: 16,
        marginBottom: 5,
    },
});

export default GroupSettingsScreen;
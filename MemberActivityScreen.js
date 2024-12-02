//VB
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MemberActivityScreen = ({ navigation }) => {
    const activities = [
        {
            id: '1',
            name: '김씨',
            date: '10월 31일',
            description: '선문대 축제 현장 공유',
            image: ''
        },
        {
            id: '2',
            name: '박씨',
            time: '1시간',
            description: '우리 학교',
            details: '지난주에는 학생 동아리의 과제를 잘 이해할 수 있도록 추가 설명과 자료를 제공했습니다...'
        }
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 활동 내역</Text>
            </View>
            <Text style={styles.sectionTitle}>최근 활동</Text>
            {activities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                    <Image source={{ uri: activity.image }} style={styles.memberImage} />
                    <View style={styles.activityInfo}>
                        <Text style={styles.memberName}>{activity.name}</Text>
                        <Text style={styles.activityDate}>{activity.date || activity.time}</Text>
                        <Text style={styles.activityDescription}>{activity.description}</Text>
                        {activity.details && <Text style={styles.activityDetails}>{activity.details}</Text>}
                    </View>
                </View>
            ))}
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
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    activityItem: {
        marginBottom: 20,
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    activityInfo: {
        marginLeft: 50,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    activityDate: {
        fontSize: 14,
        color: '#888',
    },
    activityDescription: {
        fontSize: 14,
        marginVertical: 5,
    },
    activityDetails: {
        fontSize: 14,
        color: '#555',
    },
});

export default MemberActivityScreen; 
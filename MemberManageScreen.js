// src/screens/group/MemberManageScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MemberManageScreen = ({ navigation }) => {
    const options = [
        { title: '초기 멤버 초대', screen: 'MemberRoleScreen' }, // Điều hướng đến MemberRoleScreen
        { title: '멤버 가입 요청', screen: 'MemberRequest' }, // Điều hướng đến MemberRequestScreen
        { title: '멤버 역할 부여 및 권한 관리', screen: 'Member1' }, // Điều hướng đến Member
        { title: '멤버 활동 내역 조회', screen: 'MemberActivity' }, // Điều hướng đến MemberActivityScreen
        { title: '멘토링', screen: 'Mentoring' }, // Điều hướng đến MentoringScreen (nếu đã khai báo)
        //{ title: '새로운', screen: 'NewOptionScreen' }, // Điều hướng đến NewOptionScreen (nếu đã khai báo)
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 관리</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.content}>
                {options.map((option, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.optionItem}
                        onPress={() => navigation.navigate(option.screen)} // Điều hướng đến màn hình tương ứng
                    >
                        <Text style={styles.optionText}>{option.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color="gray" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
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
    content: {
        flex: 1,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    optionText: {
        fontSize: 16,
    },
});

export default MemberManageScreen;
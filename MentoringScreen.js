//VB
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MentoringScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const members = [
        { id: '1', name: '김씨', role: '관리자', image: 'https://example.com/member1.png' },
        { id: '2', name: 'B씨', role: '관리자', image: 'https://example.com/member2.png' }
    ];

    // Lọc thành viên dựa trên từ khóa tìm kiếm
    const filteredMembers = members.filter(member => 
        member.name.includes(searchQuery) || member.role.includes(searchQuery)
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멘토링</Text>
                <View style={{ width: 24 }} /> {/* Để giữ khoảng cách cho nút quay lại */}
            </View>
            <TextInput
                style={styles.searchInput}
                placeholder="검색"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <View style={styles.buttons}>
                <TouchableOpacity style={styles.findMentorButton}>
                    <Text style={styles.buttonText}>멘토 찾기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.becomeMentorButton}>
                    <Text style={styles.buttonText}>멘토 되기</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>검사 결과</Text>
            <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.memberItem}>
                        <Image source={{ uri: item.image }} style={styles.memberImage} />
                        <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>{item.name}</Text>
                            <Text style={styles.memberRole}>{item.role}</Text>
                        </View>
                        <TouchableOpacity style={styles.matchButton}>
                            <Text style={styles.matchButtonText}>매칭</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
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
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1, // Căn giữa tiêu đề
        textAlign: 'center', // Căn giữa tiêu đề
    },
    searchInput: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    findMentorButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
    },
    becomeMentorButton: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
    },
    memberRole: {
        fontSize: 14,
        color: '#888',
    },
    matchButton: {
        backgroundColor: '#ffd3d3',
        padding: 10,
        borderRadius: 5,
    },
    matchButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default MentoringScreen; 
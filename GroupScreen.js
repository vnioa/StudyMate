//VB
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const GroupScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Header với nút back và tiêu đề */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>그룹</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Thanh tìm kiếm */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="gray" />
                <TextInput 
                    style={styles.searchInput}
                    placeholder="그룹 검색"
                    placeholderTextColor="gray"
                />
            </View>

            {/* Danh sách nhóm */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>그룹 추천</Text>
                <ScrollView>
                    <GroupItem 
                        title="선문대학교"
                        members="22.6K Members"
                    />
                    <GroupItem 
                        title="모바일 프로젝트"
                        members="2.3K Members"
                    />
                    <GroupItem 
                        title="천안시 친구들"
                        members="11.2K Members"
                    />
                </ScrollView>
            </View>

            {/* Các section khác */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>나의 그룹</Text>
                <TouchableOpacity 
                    style={styles.viewAllButton} 
                    onPress={() => navigation.navigate('MyGroup')}  
                >
                    <Text style={styles.viewAllText}>확인</Text>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>최근 활동</Text>
                <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('GroupActivity')}
                >
                    <Text style={styles.viewAllText}>확인</Text>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI 기반 그룹 매칭</Text>
                <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('AIGroupMatching')}
                >
                    <Text style={styles.viewAllText}>확인</Text>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Component cho mỗi item nhóm
const GroupItem = ({ title, members }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.groupItem}>
            <View style={styles.groupInfo}>
                <Text style={styles.groupTitle}>{title}</Text>
                <Text style={styles.groupMembers}>{members}</Text>
            </View>
            <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => navigation.navigate('GroupDetail')}
            >
                <Text style={styles.viewButtonText}>보기</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    addButton: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: '#4A90E2',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        margin: 15,
    },
    searchInput: {
        flex: 1,
        height: 36,
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    section: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 10,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 30,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    viewAllText: {
        fontSize: 16,
        color: '#0057D9',
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    groupInfo: {
        flex: 1,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0057D9',
        marginBottom: 5,
    },
    groupMembers: {
        fontSize: 14,
        color: '#888',
    },
    viewButton: {
        backgroundColor: '#0057D9',
        paddingVertical: 5,
        borderRadius: 25,
        alignItems: 'center',
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    viewButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default GroupScreen;

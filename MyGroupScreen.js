import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MyGroupScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>나의 그룹</Text>
                <View style={{ width: 24 }} /> {/* Placeholder for alignment */}
            </View>
            <View style={styles.groupInfo}>
                <Image
                    source={{ uri: "https://your-image-url.com" }} // 이미지를 URL로 변경하세요
                    style={styles.groupImage}
                />
                <Text style={styles.groupName}>선문대학교</Text>
                <Text style={styles.groupMembers}>22.6K Members</Text>
                <Text style={styles.groupEvents}>10 - 25 events per week</Text>
            </View>
            <View style={styles.buttons}>
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => navigation.navigate('MemberView')} // 'MemberView' 화면으로 이동
                >
                    <Text style={styles.buttonText}>멤버 보기</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.inviteButton]}
                    onPress={() => navigation.navigate('InviteMember')} // 'InviteMember' 화면으로 이동
                >
                    <Text style={styles.buttonText}>멤버 초대</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.memberSection}>
                <Text style={styles.memberTitle}>멤버</Text>
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => navigation.navigate('MemberManage')} // 'MemberManage' 화면으로 이동
                >
                    <Text style={styles.confirmText}>확인</Text>
                    <Ionicons name="chevron-forward" size={20} color="gray" />
                </TouchableOpacity>
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
    groupInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    groupName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    groupMembers: {
        fontSize: 16,
        color: '#888',
    },
    groupEvents: {
        fontSize: 16,
        color: '#888',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 5,
    },
    inviteButton: {
        backgroundColor: '#4A90E2',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    memberSection: {
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 10,
    },
    memberTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
    },
    confirmText: {
        fontSize: 16,
    },
});

export default MyGroupScreen;

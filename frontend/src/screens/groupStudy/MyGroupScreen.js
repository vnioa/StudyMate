import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const MyGroupScreen = ({ navigation, route }) => {
    const [groupData, setGroupData] = useState({
        name: '',
        memberCount: 0,
        eventCount: 0,
        imageUrl: '',
        members: []
    });

    const { groupId } = route.params;

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

    const fetchGroupData = async () => {
        try {
            const response = await groupAPI.getGroupDetails(groupId);
            setGroupData(response.data);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '그룹 정보를 불러오는데 실패했습니다.');
        }
    };

    const handleMemberInvite = async () => {
        try {
            const response = await groupAPI.createInvitation(groupId);
            if (response.data.success) {
                navigation.navigate('MemberInvite', {
                    groupId,
                    inviteCode: response.data.inviteCode
                });
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '초대 코드 생성에 실패했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconButton}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>나의 그룹</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.groupInfo}>
                <Image
                    source={{ uri: groupData.imageUrl || 'default_group_image_url' }}
                    style={styles.groupImage}
                />
                <Text style={styles.groupName}>{groupData.name}</Text>
                <Text style={styles.groupMembers}>
                    {groupData.memberCount}명의 멤버
                </Text>
                <Text style={styles.groupEvents}>
                    주간 {groupData.eventCount}개의 스터디
                </Text>
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('MemberView', { groupId })}
                >
                    <Text style={styles.buttonText}>멤버 보기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.inviteButton]}
                    onPress={handleMemberInvite}
                >
                    <Text style={styles.buttonText}>멤버 초대</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.memberSection}>
                <Text style={styles.memberTitle}>멤버</Text>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => navigation.navigate('MemberManage', {
                        groupId,
                        members: groupData.members
                    })}
                >
                    <Text style={styles.confirmText}>관리</Text>
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
        backgroundColor: '#f0f0f0',
    },
    groupName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    groupMembers: {
        fontSize: 16,
        color: '#666',
        marginBottom: 3,
    },
    groupEvents: {
        fontSize: 16,
        color: '#666',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 120,
        alignItems: 'center',
    },
    inviteButton: {
        backgroundColor: '#0066FF',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    memberSection: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    memberTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    confirmText: {
        fontSize: 16,
        color: '#333',
    },
});

export default MyGroupScreen;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const MemberRequestScreen = ({ navigation, route }) => {
    const [memberRequests, setMemberRequests] = useState([]);
    const { groupId } = route.params;

    useEffect(() => {
        fetchMemberRequests();
    }, [groupId]);

    const fetchMemberRequests = async () => {
        try {
            const response = await groupAPI.getMemberRequests(groupId);
            setMemberRequests(response.data.requests);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '가입 요청 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleMemberRequest = async (memberId, status) => {
        try {
            const response = await groupAPI.handleMemberRequest(groupId, memberId, status);
            if (response.data.success) {
                setMemberRequests(prev =>
                    prev.filter(member => member.id !== memberId)
                );
                Alert.alert('성공', `멤버 가입 요청을 ${status === 'accept' ? '승인' : '거절'}했습니다.`);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '요청 처리에 실패했습니다.');
        }
    };

    const renderMemberItem = ({ item }) => (
        <View style={styles.memberItem}>
            <Image
                source={{ uri: item.profileImage || 'default_profile_image_url' }}
                style={styles.memberImage}
            />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
            </View>
            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleMemberRequest(item.id, 'reject')}
                >
                    <Text style={styles.rejectButtonText}>거절</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleMemberRequest(item.id, 'accept')}
                >
                    <Text style={styles.acceptButtonText}>승인</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 관리</Text>
                <View style={{ width: 24 }} />
            </View>

            <Text style={styles.sectionTitle}>멤버 가입 요청</Text>

            <FlatList
                data={memberRequests}
                keyExtractor={(item) => item.id}
                renderItem={renderMemberItem}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>새로운 가입 요청이 없습니다.</Text>
                }
            />
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        margin: 15,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    memberEmail: {
        fontSize: 14,
        color: '#666',
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
    },
    rejectButton: {
        backgroundColor: '#f8f8f8',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    acceptButton: {
        backgroundColor: '#0066FF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    rejectButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 20,
    },
});

export default MemberRequestScreen;
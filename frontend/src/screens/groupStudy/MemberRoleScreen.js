import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const MemberRoleScreen = ({ navigation, route }) => {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const { groupId } = route.params;

    useEffect(() => {
        fetchMembers();
    }, [groupId]);

    const fetchMembers = async () => {
        try {
            const response = await groupAPI.getGroupMembers(groupId);
            setMembers(response.data.members);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '멤버 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            const response = await groupAPI.updateMemberRole(groupId, memberId, newRole);
            if (response.data.success) {
                setMembers(members.map(member =>
                    member.id === memberId ? { ...member, role: newRole } : member
                ));
                setShowRoleModal(false);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '역할 변경에 실패했습니다.');
        }
    };

    const renderMemberItem = ({ item }) => (
        <TouchableOpacity
            style={styles.memberItem}
            onPress={() => {
                setSelectedMember(item);
                setShowRoleModal(true);
            }}
        >
            <Image
                source={{ uri: item.profileImage || 'default_profile_image_url' }}
                style={styles.memberImage}
            />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberRole}>{item.role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 역할 관리</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderMemberItem}
                contentContainerStyle={styles.listContainer}
            />

            <Modal
                visible={showRoleModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowRoleModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowRoleModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>역할 변경</Text>
                        <TouchableOpacity
                            style={styles.roleOption}
                            onPress={() => handleRoleChange(selectedMember?.id, '관리자')}
                        >
                            <Text style={styles.roleText}>관리자</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.roleOption}
                            onPress={() => handleRoleChange(selectedMember?.id, '멤버')}
                        >
                            <Text style={styles.roleText}>멤버</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        textAlign: 'center',
    },
    listContainer: {
        padding: 15,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
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
    memberRole: {
        fontSize: 14,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    roleOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    roleText: {
        fontSize: 16,
        textAlign: 'center',
    }
});

export default MemberRoleScreen;
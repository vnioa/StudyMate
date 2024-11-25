import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const MemberInviteScreen = ({ navigation, route }) => {
    const [search, setSearch] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [members, setMembers] = useState([]);
    const { groupId } = route.params;

    useEffect(() => {
        fetchAvailableMembers();
    }, []);

    const fetchAvailableMembers = async () => {
        try {
            const response = await groupAPI.getAvailableMembers(groupId);
            setMembers(response.data.members);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '멤버 목록을 불러오는데 실패했습니다.');
        }
    };

    const toggleSelectMember = (id) => {
        setSelectedMembers(prev =>
            prev.includes(id) ? prev.filter(memberId => memberId !== id) : [...prev, id]
        );
    };

    const handleInviteMembers = async () => {
        if (selectedMembers.length === 0) {
            Alert.alert('알림', '초대할 멤버를 선택해주세요.');
            return;
        }

        try {
            const response = await groupAPI.inviteMembers(groupId, selectedMembers);
            if (response.data.success) {
                Alert.alert('성공', '선택한 멤버들을 초대했습니다.', [
                    { text: '확인', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '멤버 초대에 실패했습니다.');
        }
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>초기 멤버 초대</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="멤버 검색..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.memberItem}
                        onPress={() => toggleSelectMember(item.id)}
                    >
                        <Image
                            source={{ uri: item.profileImage || 'default_profile_image_url' }}
                            style={styles.memberImage}
                        />
                        <Text style={styles.memberName}>{item.name}</Text>
                        <View style={[
                            styles.checkbox,
                            selectedMembers.includes(item.id) && styles.checkboxSelected
                        ]}>
                            {selectedMembers.includes(item.id) && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                        </View>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={[
                    styles.inviteButton,
                    selectedMembers.length === 0 && styles.inviteButtonDisabled
                ]}
                onPress={handleInviteMembers}
            >
                <Text style={styles.inviteButtonText}>
                    {`${selectedMembers.length}명 초대하기`}
                </Text>
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
    },
    memberName: {
        flex: 1,
        fontSize: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#0066FF',
        borderColor: '#0066FF',
    },
    inviteButton: {
        backgroundColor: '#0066FF',
        margin: 15,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    inviteButtonDisabled: {
        backgroundColor: '#ccc',
    },
    inviteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default MemberInviteScreen;
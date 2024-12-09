import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';

const MemberRequestScreen = ({ navigation, route }) => {
    const { groupId } = route.params;
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMemberRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/groups/${groupId}/member-requests`);
            setMembers(response.data.requests);
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '멤버 요청 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMemberRequests();
            return () => setMembers([]);
        }, [fetchMemberRequests])
    );

    const handleAccept = async (id) => {
        Alert.alert('승인', '멤버 요청을 승인하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '확인',
                onPress: async () => {
                    try {
                        await axios.post(`/api/groups/${groupId}/member-requests/${id}/accept`);
                        await fetchMemberRequests();
                        Alert.alert('완료', '멤버 요청이 승인되었습니다.');
                    } catch (error) {
                        Alert.alert('오류', '멤버 승인 처리에 실패했습니다.');
                    }
                }
            }
        ]);
    };

    const handleReject = async (id) => {
        Alert.alert('거절', '멤버 요청을 거절하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '확인',
                onPress: async () => {
                    try {
                        await axios.post(`/api/groups/${groupId}/member-requests/${id}/reject`);
                        await fetchMemberRequests();
                        Alert.alert('완료', '멤버 요청이 거절되었습니다.');
                    } catch (error) {
                        Alert.alert('오류', '멤버 거절 처리에 실패했습니다.');
                    }
                }
            }
        ]);
    };

    if (loading && !members.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 가입 요청</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.memberItemContainer}>
                        <View style={styles.memberItem}>
                            <Image
                                source={item.profileImage ? { uri: item.profileImage } : require('../../../assets/study.png')}
                                style={styles.memberImage}
                            />
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{item.name}</Text>
                                {item.department && (
                                    <Text style={styles.memberDepartment}>{item.department}</Text>
                                )}
                            </View>
                            <View style={styles.buttons}>
                                <TouchableOpacity
                                    style={styles.rejectButton}
                                    onPress={() => handleReject(item.id)}
                                >
                                    <Text style={styles.rejectButtonText}>거절</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.acceptButton}
                                    onPress={() => handleAccept(item.id)}
                                >
                                    <Text style={styles.acceptButtonText}>승인</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                refreshing={refreshing}
                onRefresh={fetchMemberRequests}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        새로운 멤버 요청이 없습니다
                    </Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    memberItemContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    memberDepartment: {
        fontSize: 14,
        color: '#666',
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
    },
    rejectButton: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    acceptButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    rejectButtonText: {
        color: '#495057',
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
        marginTop: 40,
        fontSize: 16,
        color: '#666',
    }
});

export default MemberRequestScreen;
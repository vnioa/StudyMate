import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { inviteAPI } from '../../services/api';
import debounce from 'lodash/debounce';

const InviteMembersScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    // 검색 API 호출 (디바운스 적용)
    const searchUsers = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await inviteAPI.searchUsers(query);
                setSearchResults(response.users);
            } catch (error) {
                setError(error.message || '사용자 검색 중 오류가 발생했습니다.');
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    useEffect(() => {
        searchUsers(searchQuery);
    }, [searchQuery]);

    const handleSearch = (text) => {
        setSearchQuery(text);
    };

    const toggleUserSelection = (user) => {
        setSelectedUsers(prev =>
            prev.find(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handleInvite = async () => {
        if (selectedUsers.length === 0) {
            Alert.alert('알림', '초대할 사용자를 선택해주세요.');
            return;
        }

        try {
            setSending(true);
            const userIds = selectedUsers.map(user => user.id);
            await inviteAPI.sendInvitations(userIds);

            Alert.alert(
                '초대 완료',
                `${selectedUsers.length}명의 사용자를 초대했습니다.`,
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '초대 처리 중 문제가 발생했습니다.'
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Icon name="x" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>멤버 초대</Text>
                <TouchableOpacity
                    onPress={handleInvite}
                    disabled={selectedUsers.length === 0 || sending}
                    style={[
                        styles.inviteButton,
                        (selectedUsers.length === 0 || sending) && styles.inviteButtonDisabled
                    ]}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={[
                            styles.inviteButtonText,
                            selectedUsers.length === 0 && styles.inviteButtonTextDisabled
                        ]}>
                            초대하기
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* 나머지 JSX 구조는 유지하되 로딩 상태 추가 */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#666" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="이름, 이메일 또는 부서로 검색"
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoFocus={true}
                />
                {loading && (
                    <ActivityIndicator size="small" color="#4A90E2" />
                )}
            </View>

            {/* 선택된 사용자 목록 */}
            {selectedUsers.length > 0 && (
                <ScrollView
                    horizontal
                    style={styles.selectedContainer}
                    showsHorizontalScrollIndicator={false}
                >
                    {selectedUsers.map(user => (
                        <View key={user.id} style={styles.selectedUser}>
                            <Text style={styles.selectedUserText}>{user.name}</Text>
                            <TouchableOpacity
                                onPress={() => toggleUserSelection(user)}
                                style={styles.removeButton}
                            >
                                <Icon name="x" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* 검색 결과 목록 */}
            <ScrollView style={styles.resultContainer}>
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    searchResults.map(user => (
                        <TouchableOpacity
                            key={user.id}
                            style={styles.userItem}
                            onPress={() => toggleUserSelection(user)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.userDetail}>
                                    {user.department} · {user.email}
                                </Text>
                            </View>
                            <View style={[
                                styles.checkbox,
                                selectedUsers.find(u => u.id === user.id) && styles.checkboxSelected
                            ]}>
                                {selectedUsers.find(u => u.id === user.id) && (
                                    <Icon name="check" size={16} color="#fff" />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    inviteButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
    },
    inviteButtonDisabled: {
        backgroundColor: '#f0f0f0',
    },
    inviteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    inviteButtonTextDisabled: {
        color: '#999',
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
    selectedContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedUser: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        marginRight: 8,
    },
    selectedUserText: {
        marginRight: 4,
        fontSize: 14,
    },
    removeButton: {
        padding: 2,
    },
    resultContainer: {
        flex: 1,
    },
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    userDetail: {
        fontSize: 14,
        color: '#666',
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
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    backButton: {
        padding: 8,
    },
    errorText: {
        color: '#FF5252',
        textAlign: 'center',
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default InviteMembersScreen;
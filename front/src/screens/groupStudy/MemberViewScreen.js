import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Modal,
    ActivityIndicator,
    Alert,
    Platform,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';
import debounce from 'lodash/debounce';

const MemberItem = memo(({ member, onPress }) => (
    <TouchableOpacity style={styles.memberItem} onPress={onPress}>
        <Image
            source={member.profileImage 
                ? { uri: member.profileImage }
                : require('../../../assets/default-profile.png')}
            style={styles.memberAvatar}
        />
        <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRole}>{member.role}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
));

const MemberDetailModal = ({ visible, member, onClose }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>멤버 정보</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
                {member && (
                    <View style={styles.memberDetailContent}>
                        <Image
                            source={member.profileImage 
                                ? { uri: member.profileImage }
                                : require('../../../assets/default-profile.png')}
                            style={styles.detailAvatar}
                        />
                        <Text style={styles.detailName}>{member.name}</Text>
                        <Text style={styles.detailRole}>{member.role}</Text>
                        <View style={styles.detailInfo}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>이메일</Text>
                                <Text style={styles.infoValue}>{member.email}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>가입일</Text>
                                <Text style={styles.infoValue}>{member.joinedAt}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    </Modal>
);

const SearchBar = memo(({ onSearch }) => (
    <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
            style={styles.searchInput}
            placeholder="멤버 검색"
            placeholderTextColor={theme.colors.textTertiary}
            onChangeText={onSearch}
        />
    </View>
));

const MemberViewScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMembers = useCallback(async (query = '') => {
        try {
            setLoading(true);
            const response = await groupAPI.searchMembers(groupId, query);
            setMembers(response.members);
        } catch (error) {
            Alert.alert('오류', '멤버 목록을 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const debouncedSearch = useCallback(
        debounce((query) => {
            fetchMembers(query);
        }, 500),
        [fetchMembers]
    );

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        debouncedSearch(query);
    }, [debouncedSearch]);

    const handleMemberPress = useCallback(async (memberId) => {
        try {
            setLoading(true);
            const response = await groupAPI.getMemberDetail(groupId, memberId);
            setSelectedMember(response.member);
            setModalVisible(true);
        } catch (error) {
            Alert.alert('오류', '멤버 정보를 불러오는데 실패했습니다');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMembers();
            return () => {
                setMembers([]);
                setSelectedMember(null);
            };
        }, [fetchMembers])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMembers();
        setRefreshing(false);
    }, [fetchMembers]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {groupName ? `${groupName} 멤버` : '멤버 목록'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <SearchBar onSearch={handleSearch} />

            {loading && !members.length ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={members}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <MemberItem
                            member={item}
                            onPress={() => handleMemberPress(item.id)}
                        />
                    )}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {searchQuery ? '검색 결과가 없습니다' : '멤버가 없습니다'}
                        </Text>
                    }
                />
            )}

            <MemberDetailModal
                visible={modalVisible}
                member={selectedMember}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedMember(null);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flexGrow: 1,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    memberAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
        marginBottom: 4,
    },
    memberRole: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    memberDetailContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    detailAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    detailName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    detailRole: {
        fontSize: 16,
        color: theme.colors.primary,
        marginBottom: 24,
    },
    detailInfo: {
        width: '100%',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    infoLabel: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: 16,
        color: theme.colors.text,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.textSecondary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: theme.roundness.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: theme.colors.text,
        padding: Platform.select({
            ios: 8,
            android: 6
        }),
    }
});

export default memo(MemberViewScreen); 
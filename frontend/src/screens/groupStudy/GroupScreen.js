import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const GroupScreen = ({ navigation }) => {
    const [groups, setGroups] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentGroups, setRecentGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchGroups(),
                fetchRecentGroups()
            ]);
        } catch (error) {
            Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await groupAPI.getGroups();
            setGroups(response.data);
        } catch (error) {
            Alert.alert('오류', '그룹 목록을 불러오는데 실패했습니다.');
        }
    };

    const fetchRecentGroups = async () => {
        try {
            const response = await groupAPI.getRecentGroups();
            setRecentGroups(response.data);
        } catch (error) {
            Alert.alert('오류', '최근 그룹을 불러오는데 실패했습니다.');
        }
    };

    const handleCreateGroup = () => {
        navigation.navigate('CreateGroup');
    };

    const renderGroupItem = ({ item }) => (
        <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
        >
            <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupDescription}>{item.description}</Text>
                <View style={styles.groupStats}>
                    <Text style={styles.groupMembers}>
                        멤버 {item.memberCount}명
                    </Text>
                    <Text style={styles.groupCategory}>
                        {item.category}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderRecentGroups = () => (
        <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>최근 활동 그룹</Text>
            <FlatList
                horizontal
                data={recentGroups}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.recentGroupItem}
                        onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
                    >
                        <Text style={styles.recentGroupName}>{item.name}</Text>
                        <Text style={styles.recentGroupLastActivity}>
                            마지막 활동: {item.lastActivityDate}
                        </Text>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="그룹 검색"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateGroup}
                >
                    <Ionicons name="add-circle" size={24} color="#007AFF" />
                    <Text style={styles.createButtonText}>그룹 만들기</Text>
                </TouchableOpacity>
            </View>

            {renderRecentGroups()}

            <Text style={styles.sectionTitle}>전체 그룹</Text>
            <FlatList
                data={filteredGroups}
                renderItem={renderGroupItem}
                keyExtractor={item => item.id}
                style={styles.groupList}
                refreshing={loading}
                onRefresh={loadData}
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
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#e8f0fe',
        borderRadius: 8,
    },
    createButtonText: {
        marginLeft: 8,
        color: '#007AFF',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 15,
    },
    groupList: {
        flex: 1,
    },
    groupItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    groupDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    groupStats: {
        flexDirection: 'row',
        marginTop: 8,
    },
    groupMembers: {
        fontSize: 12,
        color: '#666',
        marginRight: 10,
    },
    groupCategory: {
        fontSize: 12,
        color: '#666',
    },
    recentSection: {
        marginVertical: 10,
    },
    recentGroupItem: {
        width: 150,
        padding: 15,
        marginHorizontal: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    recentGroupName: {
        fontSize: 14,
        fontWeight: '600',
    },
    recentGroupLastActivity: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
});

export default GroupScreen;
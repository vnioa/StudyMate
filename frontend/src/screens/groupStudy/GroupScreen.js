import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const RecentGroupItem = memo(({ group, onPress }) => (
    <TouchableOpacity
        style={styles.recentGroupItem}
        onPress={onPress}
    >
        <Text style={styles.recentGroupName}>{group.name}</Text>
        <Text style={styles.recentGroupLastActivity}>
            마지막 활동: {group.lastActivityDate}
        </Text>
    </TouchableOpacity>
));

const GroupItem = memo(({ group, onPress }) => (
    <TouchableOpacity
        style={styles.groupItem}
        onPress={onPress}
    >
        <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>
                {group.description}
            </Text>
            <View style={styles.groupStats}>
                <Text style={styles.groupMembers}>
                    멤버 {group.memberCount}명
                </Text>
                <Text style={styles.groupCategory}>
                    {group.category}
                </Text>
            </View>
            {group.tags && group.tags.length > 0 && (
                <View style={styles.tagContainer}>
                    {group.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    </TouchableOpacity>
));

const GroupScreen = ({ navigation }) => {
    const [groups, setGroups] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentGroups, setRecentGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [groupsResponse, recentGroupsResponse] = await Promise.all([
                groupAPI.getGroups(),
                groupAPI.getRecentGroups()
            ]);

            setGroups(groupsResponse.groups);
            setRecentGroups(recentGroupsResponse.recentGroups);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '데이터를 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
            return () => {
                setGroups([]);
                setRecentGroups([]);
            };
        }, [loadData])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const handleCreateGroup = useCallback(() => {
        navigation.navigate('CreateGroup');
    }, [navigation]);

    const navigateToGroupDetail = useCallback((groupId) => {
        navigation.navigate('GroupDetail', { groupId });
    }, [navigation]);

    const renderRecentGroups = useCallback(() => {
        if (!recentGroups.length) return null;

        return (
            <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>최근 활동 그룹</Text>
                <FlatList
                    horizontal
                    data={recentGroups}
                    renderItem={({ item }) => (
                        <RecentGroupItem
                            group={item}
                            onPress={() => navigateToGroupDetail(item.id)}
                        />
                    )}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                />
            </View>
        );
    }, [recentGroups, navigateToGroupDetail]);

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !groups.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={theme.colors.textSecondary}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="그룹 검색"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={theme.colors.textTertiary}
                    />
                </View>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateGroup}
                >
                    <Ionicons
                        name="add-circle"
                        size={24}
                        color={theme.colors.primary}
                    />
                    <Text style={styles.createButtonText}>그룹 만들기</Text>
                </TouchableOpacity>
            </View>

            {renderRecentGroups()}

            <FlatList
                data={filteredGroups}
                renderItem={({ item }) => (
                    <GroupItem
                        group={item}
                        onPress={() => navigateToGroupDetail(item.id)}
                    />
                )}
                keyExtractor={item => item.id}
                style={styles.groupList}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListHeaderComponent={
                    <Text style={styles.sectionTitle}>전체 그룹</Text>
                }
                ListEmptyComponent={
                    !loading && (
                        <Text style={styles.emptyText}>
                            {searchQuery ? '검색 결과가 없습니다' : '그룹이 없습니다'}
                        </Text>
                    )
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        paddingHorizontal: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    createButtonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        padding: theme.spacing.md,
    },
    groupList: {
        flex: 1,
    },
    groupItem: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    groupInfo: {
        flex: 1,
    },
    groupName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        color: theme.colors.text,
    },
    groupDescription: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    groupStats: {
        flexDirection: 'row',
        marginTop: theme.spacing.sm,
    },
    groupMembers: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginRight: theme.spacing.md,
    },
    groupCategory: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    recentSection: {
        marginVertical: theme.spacing.sm,
    },
    recentGroupItem: {
        width: 150,
        padding: theme.spacing.md,
        marginHorizontal: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    recentGroupName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        color: theme.colors.text,
    },
    recentGroupLastActivity: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    tag: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.small,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    tagText: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    }
});

GroupScreen.displayName = 'GroupScreen';

export default memo(GroupScreen);
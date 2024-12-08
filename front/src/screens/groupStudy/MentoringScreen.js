import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { theme } from '../../styles/theme';
import debounce from 'lodash/debounce';
const api = axios.create({
    baseURL: 'http://121.127.165.43:3000',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});
const MentoringScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [searchQuery, setSearchQuery] = useState('');
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMentors = useCallback(async (query = '') => {
        try {
            setLoading(true);
            const response = await api.get(`/api/groups/${groupId}/mentors`, {
                params: { search: query }
            });
            setMentors(response.data.mentors);
        } catch (error) {
            Alert.alert(
                '오류',
                error.response?.data?.message || '멘토 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMentors();
            return () => setMentors([]);
        }, [fetchMentors])
    );

    const debouncedSearch = useCallback(
        debounce((query) => {
            fetchMentors(query);
        }, 500),
        [fetchMentors]
    );

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        debouncedSearch(text);
    }, [debouncedSearch]);

    const handleApplyMentor = useCallback(() => {
        navigation.navigate('ApplyMentor', { groupId });
    }, [navigation, groupId]);

    const handleManageSchedule = useCallback(() => {
        navigation.navigate('ManageSchedule', { groupId });
    }, [navigation, groupId]);

    const renderMentorItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.mentorItem}
            onPress={() => navigation.navigate('MentorDetail', { mentorId: item.id })}
        >
            <View style={styles.mentorInfo}>
                <Text style={styles.mentorName}>{item.name}</Text>
                <Text style={styles.mentorField}>{item.field}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    ), [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {groupName ? `${groupName} 멘토링` : '멘토링'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons
                    name="search"
                    size={20}
                    color={theme.colors.textSecondary}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="멘토 검색..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholderTextColor={theme.colors.textTertiary}
                />
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleApplyMentor}
                >
                    <Ionicons name="person-add" size={24} color={theme.colors.primary} />
                    <Text style={styles.actionButtonText}>멘토 신청</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleManageSchedule}
                >
                    <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                    <Text style={styles.actionButtonText}>일정 관리</Text>
                </TouchableOpacity>
            </View>

            {loading && !mentors.length ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={mentors}
                    renderItem={renderMentorItem}
                    keyExtractor={item => item.id.toString()}
                    refreshing={refreshing}
                    onRefresh={() => fetchMentors(searchQuery)}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {searchQuery ? '검색 결과가 없습니다' : '등록된 멘토가 없습니다'}
                        </Text>
                    }
                />
            )}
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
        padding: theme.spacing.md,
        paddingTop: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: 16,
        color: theme.colors.text,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        width: '45%',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    actionButtonText: {
        marginTop: theme.spacing.xs,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flexGrow: 1,
        padding: theme.spacing.md,
    },
    mentorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    mentorInfo: {
        flex: 1,
    },
    mentorName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    mentorField: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: theme.colors.textSecondary,
        fontSize: 16,
    }
});

export default MentoringScreen;
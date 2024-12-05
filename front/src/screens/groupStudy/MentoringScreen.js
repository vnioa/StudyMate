import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { mentorAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const MentorItem = memo(({ mentor, onMatch }) => (
    <View style={styles.mentorItem}>
        <Image
            source={{
                uri: mentor.profileImage || 'https://via.placeholder.com/40'
            }}
            style={styles.mentorImage}
            defaultSource={require('../../../assets/default-profile.png')}
        />
        <View style={styles.mentorInfo}>
            <Text style={styles.mentorName}>{mentor.name}</Text>
            <Text style={styles.mentorSpecialty}>{mentor.specialty}</Text>
            {mentor.experience && (
                <Text style={styles.mentorExperience}>
                    경력 {mentor.experience}년
                </Text>
            )}
        </View>
        <TouchableOpacity
            style={styles.matchButton}
            onPress={onMatch}
        >
            <Text style={styles.matchButtonText}>매칭</Text>
        </TouchableOpacity>
    </View>
));

const MentoringScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [searchQuery, setSearchQuery] = useState('');
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMentors = useCallback(async () => {
        try {
            setLoading(true);
            const response = await mentorAPI.getMentors(groupId);
            setMentors(response.mentors);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '멘토 목록을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchMentors();
            return () => {
                setMentors([]);
            };
        }, [fetchMentors])
    );

    const handleBecomeMentor = useCallback(async () => {
        try {
            setLoading(true);
            await mentorAPI.applyMentor(groupId);
            Alert.alert('성공', '멘토 신청이 완료되었습니다');
            navigation.navigate('MentorApplication', {
                groupId,
                groupName
            });
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '멘토 신청에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId, navigation, groupName]);

    const handleMentorMatch = useCallback(async (mentorId) => {
        try {
            setLoading(true);
            await mentorAPI.requestMatch(groupId, { mentorId });
            Alert.alert('성공', '멘토링 매칭 요청이 전송되었습니다');
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '매칭 요청에 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMentors();
        setRefreshing(false);
    }, [fetchMentors]);

    const filteredMentors = mentors.filter(mentor =>
        mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentor.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !mentors.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

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
                    onChangeText={setSearchQuery}
                    placeholderTextColor={theme.colors.textTertiary}
                />
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.findMentorButton}
                    onPress={() => navigation.navigate('MentorSearch', {
                        groupId,
                        groupName
                    })}
                >
                    <Text style={styles.buttonText}>멘토 찾기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.becomeMentorButton}
                    onPress={handleBecomeMentor}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>멘토 되기</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>추천 멘토</Text>
            <FlatList
                data={filteredMentors}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MentorItem
                        mentor={item}
                        onMatch={() => handleMentorMatch(item.id)}
                    />
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        {searchQuery ? '검색 결과가 없습니다' : '추천 멘토가 없습니다'}
                    </Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    title: {
        ...theme.typography.headlineSmall,
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
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
    },
    buttons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    findMentorButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 2 }
        }),
    },
    becomeMentorButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.roundness.medium,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    buttonText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.white,
        fontWeight: '600',
    },
    sectionTitle: {
        ...theme.typography.headlineSmall,
        color: theme.colors.text,
        padding: theme.spacing.md,
    },
    mentorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    mentorImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    mentorInfo: {
        flex: 1,
    },
    mentorName: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        fontWeight: '600',
    },
    mentorSpecialty: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    mentorExperience: {
        ...theme.typography.bodySmall,
        color: theme.colors.textTertiary,
    },
    matchButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.roundness.medium,
    },
    matchButtonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.white,
        fontWeight: '600',
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    }
});

MentoringScreen.displayName = 'MentoringScreen';

export default memo(MentoringScreen);
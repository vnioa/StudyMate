import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Alert,
    RefreshControl,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const ActivityItem = memo(({ activity }) => (
    <View style={styles.activityItem}>
        <Image
            source={{
                uri: activity.image || 'https://via.placeholder.com/50'
            }}
            style={styles.activityImage}
            defaultSource={require('../../../assets/study.png')}
        />
        <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{activity.groupName}</Text>
            <Text style={styles.activityTime}>{activity.timestamp}</Text>
            <Text style={styles.activityDescription}>
                {activity.description}
            </Text>
            {activity.details && (
                <Text style={styles.activityDetails}>
                    {activity.details}
                </Text>
            )}
        </View>
    </View>
));

const EmptyListMessage = memo(() => (
    <View style={styles.emptyContainer}>
        <Ionicons
            name="document-text-outline"
            size={48}
            color={theme.colors.textTertiary}
        />
        <Text style={styles.emptyText}>활동 내역이 없습니다.</Text>
    </View>
));

const GroupActivityScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupActivities(groupId);
            setActivities(response.activities);
        } catch (error) {
            Alert.alert(
                '오류',
                error.message || '활동 내역을 불러오는데 실패했습니다'
            );
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchActivities();
            return () => {
                setActivities([]);
            };
        }, [fetchActivities])
    );

    useFocusEffect(
        useCallback(() => {
            fetchActivities();
            return () => {
                setActivities([]);
            };
        }, [fetchActivities])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchActivities();
        setRefreshing(false);
    }, [fetchActivities]);

    const renderItem = useCallback(({ item }) => (
        <ActivityItem activity={item} />
    ), []);

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
                <Text style={styles.title}>{groupName} 활동</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={activities}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={EmptyListMessage}
                contentContainerStyle={[
                    styles.activityList,
                    !activities.length && styles.emptyList
                ]}
                showsVerticalScrollIndicator={false}
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
    activityList: {
        padding: theme.spacing.md,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    activityItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        marginBottom: theme.spacing.sm,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    activityImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    activityInfo: {
        flex: 1,
    },
    activityName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        marginBottom: 4,
        color: theme.colors.text,
    },
    activityTime: {
        ...theme.typography.bodySmall,
        color: theme.colors.textTertiary,
        marginBottom: 4,
    },
    activityDescription: {
        ...theme.typography.bodyMedium,
        color: theme.colors.text,
        marginBottom: 4,
    },
    activityDetails: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.sm,
    }
});

GroupActivityScreen.displayName = 'GroupActivityScreen';

export default memo(GroupActivityScreen);
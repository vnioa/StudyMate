import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupAPI } from '../../services/api';
import { theme } from '../../styles/theme';

const ActivityItem = memo(({ activity }) => (
    <View style={styles.activityItem}>
        <View style={styles.activityHeader}>
            <Image
                source={{
                    uri: activity.memberImage || 'https://via.placeholder.com/40'
                }}
                style={styles.memberImage}
                defaultSource={require('../../../assets/default-profile.png')}
            />
            <View style={styles.headerInfo}>
                <Text style={styles.memberName}>{activity.memberName}</Text>
                <Text style={styles.activityDate}>{activity.timestamp}</Text>
            </View>
        </View>
        <View style={styles.activityContent}>
            <Text style={styles.activityDescription}>
                {activity.description}
            </Text>
            {activity.details && (
                <Text style={styles.activityDetails}>{activity.details}</Text>
            )}
            {activity.image && (
                <Image
                    source={{ uri: activity.image }}
                    style={styles.activityImage}
                    defaultSource={require('../../../assets/meeting.png')}
                />
            )}
        </View>
    </View>
));

const MemberActivityScreen = ({ navigation, route }) => {
    const { groupId, groupName } = route.params;
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getMemberActivities(groupId);
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

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchActivities();
        setRefreshing(false);
    }, [fetchActivities]);

    if (loading && !activities.length) {
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
                    {groupName ? `${groupName} 활동` : '멤버 활동 내역'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {activities.length > 0 ? (
                    activities.map(activity => (
                        <ActivityItem
                            key={activity.id}
                            activity={activity}
                        />
                    ))
                ) : (
                    <Text style={styles.emptyText}>
                        활동 내역이 없습니다
                    </Text>
                )}
            </ScrollView>
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
    content: {
        flex: 1,
        padding: theme.spacing.md,
    },
    activityItem: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness.medium,
        ...Platform.select({
            ios: theme.shadows.small,
            android: { elevation: 1 }
        }),
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
    },
    headerInfo: {
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    memberName: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        color: theme.colors.text,
    },
    activityDate: {
        ...theme.typography.bodySmall,
        color: theme.colors.textTertiary,
        marginTop: 2,
    },
    activityContent: {
        marginLeft: 50,
    },
    activityDescription: {
        ...theme.typography.bodyLarge,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    activityDetails: {
        ...theme.typography.bodyMedium,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    activityImage: {
        width: '100%',
        height: 200,
        borderRadius: theme.roundness.medium,
        backgroundColor: theme.colors.surface,
    },
    emptyText: {
        ...theme.typography.bodyLarge,
        textAlign: 'center',
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xl,
    }
});

MemberActivityScreen.displayName = 'MemberActivityScreen';

export default memo(MemberActivityScreen);
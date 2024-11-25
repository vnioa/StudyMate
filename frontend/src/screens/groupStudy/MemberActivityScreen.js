import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const MemberActivityScreen = ({ navigation, route }) => {
    const [activities, setActivities] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const { groupId } = route.params;

    useEffect(() => {
        fetchActivities();
    }, [groupId]);

    const fetchActivities = async () => {
        try {
            const response = await groupAPI.getMemberActivities(groupId);
            setActivities(response.data.activities);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '활동 내역을 불러오는데 실패했습니다.');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchActivities();
        } catch (error) {
            Alert.alert('오류', '새로고침에 실패했습니다.');
        }
        setRefreshing(false);
    };

    const renderActivityItem = (activity) => (
        <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityHeader}>
                <Image
                    source={{ uri: activity.memberImage || 'default_profile_image_url' }}
                    style={styles.memberImage}
                />
                <View style={styles.headerInfo}>
                    <Text style={styles.memberName}>{activity.memberName}</Text>
                    <Text style={styles.activityDate}>{activity.timestamp}</Text>
                </View>
            </View>
            <View style={styles.activityContent}>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                {activity.details && (
                    <Text style={styles.activityDetails}>{activity.details}</Text>
                )}
                {activity.image && (
                    <Image
                        source={{ uri: activity.image }}
                        style={styles.activityImage}
                    />
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 활동 내역</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                {activities.length > 0 ? (
                    activities.map(renderActivityItem)
                ) : (
                    <Text style={styles.emptyText}>활동 내역이 없습니다.</Text>
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
    content: {
        flex: 1,
        padding: 15,
    },
    activityItem: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    memberImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    headerInfo: {
        marginLeft: 10,
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
    },
    activityDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    activityContent: {
        marginLeft: 50,
    },
    activityDescription: {
        fontSize: 15,
        marginBottom: 8,
    },
    activityDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    activityImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 30,
    },
});

export default MemberActivityScreen;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupAPI } from '../../services/api';

const GroupActivityScreen = ({ navigation, route }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const { groupId } = route.params;

    useEffect(() => {
        fetchActivities();
    }, [groupId]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await groupAPI.getGroupActivities(groupId);
            setActivities(response.data.activities);
        } catch (error) {
            Alert.alert('오류', error.response?.data?.message || '활동 내역을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const renderActivityItem = ({ item }) => (
        <View style={styles.activityItem}>
            <Image
                source={{ uri: item.image || 'default_activity_image_url' }}
                style={styles.activityImage}
            />
            <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{item.groupName}</Text>
                <Text style={styles.activityTime}>{item.timestamp}</Text>
                <Text style={styles.activityDescription}>{item.description}</Text>
                {item.details && (
                    <Text style={styles.activityDetails}>{item.details}</Text>
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
                <Text style={styles.title}>그룹 활동</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={activities}
                renderItem={renderActivityItem}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchActivities}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>활동 내역이 없습니다.</Text>
                }
                contentContainerStyle={styles.activityList}
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
    activityList: {
        padding: 15,
    },
    activityItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activityImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#f0f0f0',
    },
    activityInfo: {
        flex: 1,
    },
    activityName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    activityDescription: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    activityDetails: {
        fontSize: 14,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 30,
    }
});

export default GroupActivityScreen;
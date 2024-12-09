import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const MemberActivityScreen = ({ navigation }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchActivities = async () => {
        try {
            setError(null);
            const response = await axios.get('/api/member-activities');
            setActivities(response.data);
        } catch (err) {
            setError('활동 내역을 불러오는데 실패했습니다.');
            Alert.alert('오류', '활동 내역을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchActivities();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>멤버 활동 내역</Text>
            </View>

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>최근 활동</Text>
                    {activities.map((activity) => (
                        <TouchableOpacity
                            key={activity.id}
                            style={styles.activityItem}
                            onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
                        >
                            <View style={styles.activityContent}>
                                <Image
                                    source={{
                                        uri: activity.image || 'https://via.placeholder.com/50'
                                    }}
                                    style={styles.memberImage}
                                />
                                <View style={styles.activityInfo}>
                                    <View style={styles.nameTimeContainer}>
                                        <Text style={styles.memberName}>
                                            {activity.name}
                                        </Text>
                                        <Text style={styles.activityDate}>
                                            {activity.date || activity.time}
                                        </Text>
                                    </View>
                                    <Text style={styles.activityDescription}>
                                        {activity.description}
                                    </Text>
                                    {activity.details && (
                                        <Text
                                            style={styles.activityDetails}
                                            numberOfLines={2}
                                        >
                                            {activity.details}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: 20,
        marginBottom: 10,
    },
    activityItem: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activityContent: {
        flexDirection: 'row',
    },
    memberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    activityInfo: {
        flex: 1,
    },
    nameTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    activityDate: {
        fontSize: 14,
        color: '#888',
    },
    activityDescription: {
        fontSize: 15,
        marginVertical: 5,
        color: '#333',
    },
    activityDetails: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    errorText: {
        color: '#FF5252',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    }
});

export default MemberActivityScreen;
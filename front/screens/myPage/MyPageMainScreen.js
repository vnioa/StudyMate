import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Platform,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUserProfile, updateLearningStats } from '../redux/actions/userActions';

const API_URL = 'http://121.127.165.43:3000';

const { width, height } = Dimensions.get('window');

const MyPageMainScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const userProfile = useSelector(state => state.user.profile);
    const learningStats = useSelector(state => state.user.learningStats);

    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUserProfile();
        loadLearningStats();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadLearningStats();
        }, [])
    );

    const loadUserProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_BASE_URL}/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(setUserProfile(response.data));
            setLoading(false);
        } catch (error) {
            console.error('Error loading user profile:', error);
            setError('Failed to load user profile. Please try again.');
            setLoading(false);
        }
    };

    const loadLearningStats = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_BASE_URL}/user/learning-stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            dispatch(updateLearningStats(response.data));
        } catch (error) {
            console.error('Error loading learning stats:', error);
            setError('Failed to load learning statistics. Please try again.');
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([loadUserProfile(), loadLearningStats()]);
        } catch (error) {
            console.error('Error refreshing data:', error);
            setError('Failed to refresh data. Please try again.');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleProfileImageUpdate = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            alert('Permission to access camera roll is required!');
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!pickerResult.cancelled) {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const formData = new FormData();
                formData.append('profileImage', {
                    uri: pickerResult.uri,
                    type: 'image/jpeg',
                    name: 'profile.jpg',
                });

                const response = await axios.post(`${API_BASE_URL}/user/update-profile-image`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });

                dispatch(setUserProfile({ ...userProfile, profileImage: response.data.profileImage }));
            } catch (error) {
                console.error('Error updating profile image:', error);
                alert('Failed to update profile image. Please try again.');
            }
        }
    };

    const handleEditProfile = () => {
        navigation.navigate('EditProfile', { userProfile });
    };

    const handleViewAchievements = () => {
        navigation.navigate('Achievements');
    };

    const handleViewLearningHistory = () => {
        navigation.navigate('LearningHistory');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <LinearGradient
                colors={['#4A90E2', '#50E3C2']}
                style={styles.header}
            >
                <TouchableOpacity onPress={handleProfileImageUpdate}>
                    <Image
                        source={{ uri: userProfile.profileImage }}
                        style={styles.profileImage}
                    />
                    <View style={styles.editIconContainer}>
                        <Ionicons name="camera" size={20} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.userName}>{userProfile.name}</Text>
                <Text style={styles.userEmail}>{userProfile.email}</Text>
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{learningStats.totalLearningTime}</Text>
                    <Text style={styles.statLabel}>Total Learning Time</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{learningStats.completedCourses}</Text>
                    <Text style={styles.statLabel}>Completed Courses</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{learningStats.averageScore}%</Text>
                    <Text style={styles.statLabel}>Average Score</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={handleViewAchievements}>
                <Ionicons name="trophy-outline" size={24} color="#4A90E2" />
                <Text style={styles.menuItemText}>View Achievements</Text>
                <Ionicons name="chevron-forward-outline" size={24} color="#757575" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleViewLearningHistory}>
                <Ionicons name="time-outline" size={24} color="#4A90E2" />
                <Text style={styles.menuItemText}>Learning History</Text>
                <Ionicons name="chevron-forward-outline" size={24} color="#757575" />
            </TouchableOpacity>

            {/* Add more menu items as needed */}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 10,
    },
    editIconContainer: {
        position: 'absolute',
        right: 0,
        bottom: 10,
        backgroundColor: '#4A90E2',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 15,
    },
    editButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginTop: -20,
        borderRadius: 20,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    statLabel: {
        fontSize: 14,
        color: '#757575',
        marginTop: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginTop: 10,
        marginHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: '#333333',
        marginLeft: 15,
    },
});

export default MyPageMainScreen;
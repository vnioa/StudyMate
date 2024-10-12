import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    StyleSheet,
    Platform,
    UIManager,
    LayoutAnimation,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebSocket } from 'react-native-websocket';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

const FriendProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { friendId } = route.params;

    const [friendData, setFriendData] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [gradientColors, setGradientColors] = useState(['#4A90E2', '#F5A623']);

    const animatedScale = useRef(new Animated.Value(0)).current;
    const animatedOpacity = useRef(new Animated.Value(0)).current;

    const ws = useRef(null);

    useEffect(() => {
        fetchFriendData();
        initializeWebSocket();
        animateEntry();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const fetchFriendData = async () => {
        try {
            const cachedData = await AsyncStorage.getItem(`friend_${friendId}`);
            if (cachedData) {
                setFriendData(JSON.parse(cachedData));
            }

            const response = await fetch(`YOUR_API_URL/friends/${friendId}`);
            const data = await response.json();
            setFriendData(data);
            await AsyncStorage.setItem(`friend_${friendId}`, JSON.stringify(data));

            generateGradientColors(data.profileImage);
        } catch (error) {
            console.error('Error fetching friend data:', error);
        }
    };

    const initializeWebSocket = () => {
        ws.current = new WebSocket(`YOUR_WEBSOCKET_URL`);
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'status_update' && data.friendId === friendId) {
                updateFriendStatus(data.status);
            }
        };
    };

    const updateFriendStatus = (status) => {
        setFriendData((prevData) => ({ ...prevData, status }));
    };

    const generateGradientColors = (imageUrl) => {
        // In a real implementation, you'd use an image processing library to extract colors
        // For this example, we'll just use a placeholder function
        const colors = getColorsFromImage(imageUrl);
        setGradientColors(colors);
    };

    const getColorsFromImage = (imageUrl) => {
        // Placeholder function
        return ['#4A90E2', '#F5A623'];
    };

    const animateEntry = () => {
        Animated.parallel([
            Animated.spring(animatedScale, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(animatedOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleTabChange = (tab) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const handleImagePress = () => {
        setImageViewerVisible(true);
    };

    const handleLongPress = () => {
        // Implement save image functionality
    };

    const handleDoubleTap = () => {
        // Implement like functionality with animation
    };

    const handleChat = () => {
        navigation.navigate('ChatRoom', { friendId });
    };

    const handleVoiceCall = () => {
        navigation.navigate('VoiceCall', { friendId });
    };

    const handleVideoCall = () => {
        navigation.navigate('VideoCall', { friendId });
    };

    const handleBlock = () => {
        // Implement block functionality
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <View style={styles.tabContent}>
                        <Text style={styles.infoText}>Email: {friendData.email}</Text>
                        <Text style={styles.infoText}>Phone: {friendData.phone}</Text>
                        <Text style={styles.infoText}>Location: {friendData.location}</Text>
                    </View>
                );
            case 'media':
                return (
                    <View style={styles.mediaGrid}>
                        {friendData.sharedMedia.map((media, index) => (
                            <FastImage
                                key={index}
                                source={{ uri: media.url }}
                                style={styles.mediaItem}
                                resizeMode={FastImage.resizeMode.cover}
                            />
                        ))}
                    </View>
                );
            case 'groups':
                return (
                    <ScrollView horizontal style={styles.groupsContainer}>
                        {friendData.commonGroups.map((group, index) => (
                            <View key={index} style={styles.groupItem}>
                                <FastImage
                                    source={{ uri: group.image }}
                                    style={styles.groupImage}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                <Text style={styles.groupName}>{group.name}</Text>
                            </View>
                        ))}
                    </ScrollView>
                );
            default:
                return null;
        }
    };

    if (!friendData) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#4A90E2" /></View>;
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={gradientColors} style={styles.background}>
                <Animated.View style={[styles.content, { opacity: animatedOpacity, transform: [{ scale: animatedScale }] }]}>
                    <TouchableOpacity onPress={handleImagePress} onLongPress={handleLongPress} onPress={handleDoubleTap}>
                        <FastImage
                            source={{ uri: friendData.profileImage }}
                            style={styles.profileImage}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    </TouchableOpacity>
                    <Text style={styles.name}>{friendData.name}</Text>
                    <Text style={styles.statusMessage}>{friendData.statusMessage}</Text>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity onPress={() => handleTabChange('info')} style={[styles.tab, activeTab === 'info' && styles.activeTab]}>
                            <Text style={styles.tabText}>Info</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleTabChange('media')} style={[styles.tab, activeTab === 'media' && styles.activeTab]}>
                            <Text style={styles.tabText}>Media</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleTabChange('groups')} style={[styles.tab, activeTab === 'groups' && styles.activeTab]}>
                            <Text style={styles.tabText}>Groups</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.tabContentContainer}>
                        {renderTabContent()}
                    </ScrollView>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={handleChat} style={styles.actionButton}>
                            <Icon name="chat" size={24} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleVoiceCall} style={styles.actionButton}>
                            <Icon name="call" size={24} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleVideoCall} style={styles.actionButton}>
                            <Icon name="videocam" size={24} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Video</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleBlock} style={styles.actionButton}>
                            <Icon name="block" size={24} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Block</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 50,
    },
    profileImage: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: (width * 0.4) / 2,
        marginBottom: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    statusMessage: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    activeTab: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tabText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    tabContentContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
    },
    infoText: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333333',
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    mediaItem: {
        width: (width - 60) / 3,
        height: (width - 60) / 3,
        marginBottom: 10,
        borderRadius: 10,
    },
    groupsContainer: {
        flexDirection: 'row',
    },
    groupItem: {
        marginRight: 20,
        alignItems: 'center',
    },
    groupImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 5,
    },
    groupName: {
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingVertical: 20,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        marginTop: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FriendProfileScreen;
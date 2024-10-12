import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    Switch,
    VirtualizedList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';
import { useSocket } from '../hooks/useSocket';
import { useFriendRecommendation } from '../hooks/useFriendRecommendation';
import { useContactSync } from '../hooks/useContactSync';
import { useDrag } from 'react-dnd';
import Voice from '@react-native-voice/voice';

const { width } = Dimensions.get('window');

const FriendListScreen = () => {
    const navigation = useNavigation();
    const socket = useSocket();
    const friendRecommendation = useFriendRecommendation();
    const contactSync = useContactSync();

    const [friends, setFriends] = useState([]);
    const [favoritesFriends, setFavoritesFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGridView, setIsGridView] = useState(false);
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);

    const translateX = new Animated.Value(0);
    const scale = new Animated.Value(1);

    useEffect(() => {
        fetchFriends();
        socket.on('friendStatusUpdate', handleFriendStatusUpdate);
        contactSync.startPeriodicSync(3600000);

        return () => {
            socket.off('friendStatusUpdate', handleFriendStatusUpdate);
            contactSync.stopPeriodicSync();
        };
    }, []);

    const fetchFriends = async () => {
        try {
            const response = await fetch('API_URL/friends');
            const data = await response.json();
            setFriends(data.friends);
            setFavoritesFriends(data.favorites);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const handleFriendStatusUpdate = (updatedFriend) => {
        setFriends(prevFriends =>
            prevFriends.map(friend =>
                friend.id === updatedFriend.id ? { ...friend, ...updatedFriend } : friend
            )
        );
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
    };

    const handleAddFriend = () => {
        navigation.navigate('AddFriend');
    };

    const handleFriendPress = (friend) => {
        if (multiSelectMode) {
            toggleFriendSelection(friend);
        } else {
            navigation.navigate('FriendProfile', { friendId: friend.id });
        }
    };

    const handleLongPress = (friend) => {
        setMultiSelectMode(true);
        setSelectedFriends([friend.id]);
    };

    const toggleFriendSelection = (friend) => {
        setSelectedFriends(prevSelected =>
            prevSelected.includes(friend.id)
                ? prevSelected.filter(id => id !== friend.id)
                : [...prevSelected, friend.id]
        );
    };

    const handleSwipe = (friendId, direction) => {
        if (direction === 'left') {
            blockFriend(friendId);
        } else if (direction === 'right') {
            toggleFavorite(friendId);
        }
    };

    const blockFriend = async (friendId) => {
        try {
            await fetch(`API_URL/friends/${friendId}/block`, { method: 'POST' });
            setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
        } catch (error) {
            console.error('Error blocking friend:', error);
        }
    };

    const toggleFavorite = async (friendId) => {
        try {
            const response = await fetch(`API_URL/friends/${friendId}/favorite`, { method: 'POST' });
            const updatedFriend = await response.json();
            setFriends(prevFriends =>
                prevFriends.map(friend =>
                    friend.id === friendId ? updatedFriend : friend
                )
            );
            updateFavorites();
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const updateFavorites = () => {
        const newFavorites = friends.filter(friend => friend.isFavorite).slice(0, 5);
        setFavoritesFriends(newFavorites);
    };

    const toggleViewMode = () => {
        setIsGridView(prevMode => !prevMode);
    };

    const startVoiceSearch = async () => {
        try {
            await Voice.start('en-US');
            setIsVoiceSearchActive(true);
        } catch (error) {
            console.error('Error starting voice search:', error);
        }
    };

    const stopVoiceSearch = async () => {
        try {
            await Voice.stop();
            setIsVoiceSearchActive(false);
        } catch (error) {
            console.error('Error stopping voice search:', error);
        }
    };

    Voice.onResult = (event) => {
        const result = event.value[0];
        setSearchQuery(result);
        stopVoiceSearch();
    };

    const renderFriendItem = ({ item }) => {
        const panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 20;
            },
            onPanResponderMove: (_, gestureState) => {
                translateX.setValue(gestureState.dx);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -width * 0.7) {
                    handleSwipe(item.id, 'left');
                } else if (gestureState.dx > width * 0.7) {
                    handleSwipe(item.id, 'right');
                }
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        });

        return (
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.friendItem,
                    { transform: [{ translateX }] },
                    isGridView && styles.gridItem,
                    selectedFriends.includes(item.id) && styles.selectedItem,
                ]}
            >
                <TouchableOpacity
                    onPress={() => handleFriendPress(item)}
                    onLongPress={() => handleLongPress(item)}
                >
                    <FastImage
                        source={{ uri: item.avatar }}
                        style={styles.avatar}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.statusMessage}>{item.statusMessage}</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const getItemCount = () => friends.length;

    const getItem = (data, index) => friends[index];

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search friends"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <TouchableOpacity onPress={isVoiceSearchActive ? stopVoiceSearch : startVoiceSearch}>
                    <Icon name={isVoiceSearchActive ? "mic-off" : "mic"} size={24} color="#757575" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
                <Icon name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.myProfileSection}>
                {/* Implement My Profile Section */}
            </View>

            <View style={styles.favoritesSection}>
                <Text style={styles.sectionTitle}>Favorites</Text>
                <FlatList
                    data={favoritesFriends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            <View style={styles.allFriendsSection}>
                <Text style={styles.sectionTitle}>All Friends</Text>
                <TouchableOpacity onPress={toggleViewMode}>
                    <Icon name={isGridView ? "view-list" : "grid-view"} size={24} color="#757575" />
                </TouchableOpacity>
                <VirtualizedList
                    data={friends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item.id}
                    getItemCount={getItemCount}
                    getItem={getItem}
                    numColumns={isGridView ? 3 : 1}
                    key={isGridView ? 'grid' : 'list'}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        margin: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
    },
    addButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    myProfileSection: {
        height: 100,
        backgroundColor: '#E3F2FD',
        marginBottom: 10,
    },
    favoritesSection: {
        marginBottom: 10,
    },
    allFriendsSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        margin: 10,
    },
    friendItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    gridItem: {
        width: width / 3 - 10,
        aspectRatio: 1,
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedItem: {
        backgroundColor: '#E3F2FD',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 5,
    },
    statusMessage: {
        fontSize: 14,
        color: '#757575',
    },
});

export default FriendListScreen;
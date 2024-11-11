// AddFriendScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Keyboard,
    Alert,
    Share,
    Switch, LayoutAnimation, RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { debounce } from 'lodash';
import {BlurView} from "@react-native-community/blur";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SEARCH_BAR_HEIGHT = 50;
const RECOMMENDED_CARD_WIDTH = 120;
const RECOMMENDED_CARD_HEIGHT = 160;

const AddFriendScreen = () => {
    // 상태 관리
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [recommendedFriends, setRecommendedFriends] = useState([]);
    const [recentContacts, setRecentContacts] = useState([]);
    const [isContactSync, setIsContactSync] = useState(false);
    const [showProfilePreview, setShowProfilePreview] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Refs
    const searchInputRef = useRef(null);
    const scrollViewRef = useRef(null);
    const searchBarAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    // Navigation
    const navigation = useNavigation();

    // 초기화
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await Promise.all([
                checkPermissions(),
                loadRecentSearches(),
                fetchRecommendedFriends(),
                loadRecentContacts(),
                checkContactSyncStatus()
            ]);
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('오류', '화면을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        saveRecentSearches();
    };

    // 권한 체크
    const checkPermissions = async () => {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        const { status: contactsStatus } = await Contacts.requestPermissionsAsync();

        setHasPermission(cameraStatus === 'granted');

        if (contactsStatus === 'granted' && isContactSync) {
            await syncContacts();
        }
    };

    // 검색 관련 함수
    const handleSearch = debounce(async (text) => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/api/friends/search`, {
                params: { query: text },
                headers: { Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}` }
            });

            setSearchResults(response.data);
            updateRecentSearches(text);
            setIsLoading(false);
        } catch (error) {
            console.error('Search failed:', error);
            setIsLoading(false);
            Alert.alert('검색 오류', '친구 검색에 실패했습니다.');
        }
    }, 300);

    const updateRecentSearches = (query) => {
        if (!query.trim()) return;

        setRecentSearches(prev => {
            const updated = [query, ...prev.filter(item => item !== query)].slice(0, 10);
            AsyncStorage.setItem('recentFriendSearches', JSON.stringify(updated));
            return updated;
        });
    };

    // QR 코드 스캔 관련 함수
    const handleBarCodeScanned = async ({ type, data }) => {
        try {
            setScanned(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const response = await axios.get(`${API_URL}/api/friends/qr/${data}`, {
                headers: { Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}` }
            });

            if (response.data) {
                setSelectedProfile(response.data);
                setShowProfilePreview(true);
            }
        } catch (error) {
            console.error('QR code scan failed:', error);
            Alert.alert('스캔 오류', 'QR 코드 스캔에 실패했습니다.');
        }
    };

    // 스캔 라인 애니메이션
    const startScanLineAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true
                })
            ])
        ).start();
    };

    useEffect(() => {
        if (showQRScanner) {
            startScanLineAnimation();
        }
    }, [showQRScanner]);
    // 추천 친구 관련 함수
    const fetchRecommendedFriends = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/api/friends/recommended`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRecommendedFriends(response.data);
        } catch (error) {
            console.error('Failed to fetch recommended friends:', error);
        }
    };

    // 최근 연락처 관련 함수
    const loadRecentContacts = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [
                        Contacts.Fields.PhoneNumbers,
                        Contacts.Fields.Emails,
                        Contacts.Fields.Image
                    ],
                    sort: Contacts.SortTypes.LastName
                });

                const recentContacts = data
                    .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
                    .slice(0, 20);

                setRecentContacts(recentContacts);
            }
        } catch (error) {
            console.error('Failed to load recent contacts:', error);
            Alert.alert('오류', '연락처를 불러오는데 실패했습니다.');
        }
    };

    // 연락처 동기화 관련 함수
    const handleContactSync = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const contacts = await Contacts.getContactsAsync();

            // 청크 단위로 연락처 동기화
            const chunkSize = 100;
            for (let i = 0; i < contacts.data.length; i += chunkSize) {
                const chunk = contacts.data.slice(i, i + chunkSize);
                await axios.post(
                    `${API_URL}/api/contacts/sync`,
                    { contacts: chunk },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            await AsyncStorage.setItem('lastContactSync', new Date().toISOString());
            setIsContactSync(true);
            setIsLoading(false);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('성공', '연락처 동기화가 완료되었습니다.');
        } catch (error) {
            console.error('Contact sync failed:', error);
            setIsLoading(false);
            Alert.alert('오류', '연락처 동기화에 실패했습니다.');
        }
    };

    // QR 코드 스캔 관련 함수
    const handleQRScan = async (data) => {
        try {
            setScanned(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/api/friends/qr/${data}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                setSelectedProfile(response.data);
                setShowProfilePreview(true);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('QR scan failed:', error);
            Alert.alert('오류', 'QR 코드 스캔에 실패했습니다.');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // 친구 추가 관련 함수
    const handleAddFriend = async (friendId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(
                `${API_URL}/api/friends/add`,
                { friendId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 성공 애니메이션 및 피드백
            showSuccessAnimation();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 친구 목록 새로고침
            await fetchRecommendedFriends();

        } catch (error) {
            console.error('Failed to add friend:', error);
            Alert.alert('오류', '친구 추가에 실패했습니다.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // 성공 애니메이션
    const showSuccessAnimation = () => {
        // 컨페티 애니메이션 표시
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setShowConfetti(true);

        // 1초 후 컨페티 숨기기
        setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowConfetti(false);
        }, 1000);
    };

    // 초대하기 기능
    const handleInvite = async () => {
        try {
            const result = await Share.share({
                message: `${user.name}님이 StudyMate에 초대했습니다.\n다운로드: [앱 스토어 링크]`,
                title: 'StudyMate 초대'
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // 공유 완료
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            }
        } catch (error) {
            console.error('Share invitation failed:', error);
            Alert.alert('오류', '초대 링크 공유에 실패했습니다.');
        }
    };

    // 렌더링 메서드
    const renderSearchSection = () => (
        <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
                <MaterialIcons
                    name="search"
                    size={24}
                    color="#757575"
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="친구 ID 또는 전화번호 검색"
                    placeholderTextColor="#757575"
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity
                    style={styles.qrButton}
                    onPress={() => setShowQRScanner(true)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons
                        name="qr-code-scanner"
                        size={24}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
    // 추천 친구 목록 렌더링
    const renderRecommendedFriends = () => (
        <View style={styles.recommendedSection}>
            <Text style={styles.sectionTitle}>추천 친구</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendedList}
            >
                {recommendedFriends.map((friend) => (
                    <TouchableOpacity
                        key={friend.id}
                        style={styles.recommendedCard}
                        onPress={() => handleFriendPress(friend)}
                        onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setSelectedProfile(friend);
                            setShowProfilePreview(true);
                        }}
                        delayLongPress={500}
                    >
                        <FastImage
                            style={styles.recommendedImage}
                            source={{
                                uri: friend.profileImage,
                                priority: FastImage.priority.normal
                            }}
                            defaultSource={require('../../assets/images/icons/user.png')}
                        />
                        <Text style={styles.recommendedName} numberOfLines={1}>
                            {friend.name}
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleAddFriend(friend.id)}
                        >
                            <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>친구 추가</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    // 최근 연락처 섹션 렌더링
    const renderRecentContacts = () => (
        <View style={styles.recentContactsSection}>
            <Text style={styles.sectionTitle}>최근 연락처</Text>
            <View style={styles.contactsGrid}>
                {recentContacts.map((contact) => (
                    <TouchableOpacity
                        key={contact.id}
                        style={styles.contactItem}
                        onPress={() => handleContactPress(contact)}
                        onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setSelectedContact(contact);
                            setShowContactOptions(true);
                        }}
                    >
                        <FastImage
                            style={styles.contactImage}
                            source={{
                                uri: contact.profileImage,
                                priority: FastImage.priority.normal
                            }}
                            defaultSource={require('../../assets/images/icons/user.png')}
                        />
                        <Text style={styles.contactName} numberOfLines={1}>
                            {contact.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // QR 스캐너 모달 렌더링
    const renderQRScanner = () => (
        <Modal
            visible={showQRScanner}
            onRequestClose={() => setShowQRScanner(false)}
            animationType="slide"
        >
            <View style={styles.qrScannerContainer}>
                <Camera
                    style={styles.qrScanner}
                    type={Camera.Constants.Type.back}
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                >
                    <View style={styles.qrScannerOverlay}>
                        <View style={styles.qrScannerFrame}>
                            <Animated.View
                                style={[
                                    styles.scanLine,
                                    {
                                        transform: [{
                                            translateY: scanLineAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, 200]
                                            })
                                        }]
                                    }
                                ]}
                            />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.closeScannerButton}
                        onPress={() => setShowQRScanner(false)}
                    >
                        <MaterialIcons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </Camera>
            </View>
        </Modal>
    );

    // 프로필 미리보기 모달 렌더링
    const renderProfilePreview = () => (
        <Modal
            visible={showProfilePreview}
            transparent={true}
            onRequestClose={() => setShowProfilePreview(false)}
            animationType="fade"
        >
            <BlurView
                style={styles.profilePreviewContainer}
                blurType="light"
                blurAmount={10}
            >
                <View style={styles.profilePreviewCard}>
                    <FastImage
                        style={styles.previewProfileImage}
                        source={{
                            uri: selectedProfile?.profileImage,
                            priority: FastImage.priority.high
                        }}
                        defaultSource={require('../../assets/images/icons/user.png')}
                    />
                    <Text style={styles.previewName}>{selectedProfile?.name}</Text>
                    <Text style={styles.previewStatus}>{selectedProfile?.statusMessage}</Text>
                    <View style={styles.previewButtons}>
                        <TouchableOpacity
                            style={[styles.previewButton, styles.addButton]}
                            onPress={() => handleAddFriend(selectedProfile?.id)}
                        >
                            <MaterialIcons name="person-add" size={24} color="#FFFFFF" />
                            <Text style={styles.buttonText}>친구 추가</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.previewButton, styles.messageButton]}
                            onPress={() => handleStartMessage(selectedProfile?.id)}
                        >
                            <MaterialIcons name="message" size={24} color="#FFFFFF" />
                            <Text style={styles.buttonText}>메시지 보내기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 검색바 및 QR 스캔 버튼 */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <MaterialIcons
                        name="search"
                        size={24}
                        color="#757575"
                        style={styles.searchIcon}
                    />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchBar}
                        placeholder="친구 ID 또는 전화번호 검색"
                        placeholderTextColor="#757575"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={styles.qrButton}
                        onPress={() => setShowQRScanner(true)}
                    >
                        <MaterialIcons name="qr-code-scanner" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 메인 콘텐츠 */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#2196F3']}
                    />
                }
            >
                {renderRecommendedFriends()}
                {renderRecentContacts()}
            </ScrollView>

            {/* 하단 동기화 및 초대 버튼 */}
            <View style={styles.footer}>
                <View style={styles.syncContainer}>
                    <Text style={styles.syncText}>연락처 동기화</Text>
                    <Switch
                        value={isContactSync}
                        onValueChange={handleContactSync}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isContactSync ? '#2196F3' : '#f4f3f4'}
                    />
                </View>
                <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={handleInvite}
                >
                    <Text style={styles.inviteButtonText}>친구 초대하기</Text>
                </TouchableOpacity>
            </View>

            {/* 모달 */}
            {renderQRScanner()}
            {renderProfilePreview()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    searchBar: {
        flex: 1,
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingLeft: 44,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchIcon: {
        position: 'absolute',
        left: 16,
        top: 13,
        zIndex: 1,
    },
    qrButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    content: {
        flex: 1,
    },
    recommendedSection: {
        marginTop: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
        marginLeft: 16,
        marginBottom: 12,
    },
    recommendedList: {
        paddingHorizontal: 8,
    },
    recommendedCard: {
        width: 120,
        height: 160,
        marginHorizontal: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        alignItems: 'center',
        padding: 12,
    },
    recommendedImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    recommendedName: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addButtonText: {
        fontSize: 12,
        fontFamily: 'Roboto-Medium',
        color: '#FFFFFF',
        marginLeft: 4,
    },
    recentContactsSection: {
        marginBottom: 24,
    },
    contactsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    contactItem: {
        width: (SCREEN_WIDTH - 48) / 3,
        alignItems: 'center',
        marginHorizontal: 8,
        marginBottom: 16,
    },
    contactImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    contactName: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    syncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    syncText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
    },
    inviteButton: {
        backgroundColor: '#FF4081',
        borderRadius: 25,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteButtonText: {
        fontSize: 18,
        fontFamily: 'Roboto-Bold',
        color: '#FFFFFF',
    },
    qrScannerContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    qrScanner: {
        flex: 1,
    },
    qrScannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrScannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
    },
    scanLine: {
        height: 2,
        backgroundColor: '#2196F3',
        width: '100%',
    },
    closeScannerButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePreviewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    profilePreviewCard: {
        width: SCREEN_WIDTH * 0.8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    previewProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    previewName: {
        fontSize: 20,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
        marginBottom: 8,
    },
    previewStatus: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
        marginBottom: 16,
    },
    previewButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    previewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        width: '45%',
    },
    messageButton: {
        backgroundColor: '#4A90E2',
    },
    favoriteButton: {
        backgroundColor: '#FFD700',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        marginLeft: 8,
    },
    saveOptionsModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    saveOptionsContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    saveOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    saveOptionText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        marginLeft: 16,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#FF3B30',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
        textAlign: 'center',
        marginTop: 8,
    },
    indexBar: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: [{ translateY: -200 }],
        width: 20,
        backgroundColor: 'transparent',
    },
    indexItem: {
        height: 16,
        width: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indexText: {
        fontSize: 12,
        color: '#757575',
    },
    suggestionContainer: {
        position: 'absolute',
        top: HEADER_HEIGHT + SEARCH_BAR_HEIGHT,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        maxHeight: 200,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    suggestionIcon: {
        marginRight: 16,
    },
    suggestionText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
    },
    recentSearchText: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },
    contactSyncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F5F5F5',
    },
    contactSyncText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
    },
    successAnimation: {
        position: 'absolute',
        alignSelf: 'center',
        top: '40%',
    },
    viewModeContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    viewModeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    activeViewMode: {
        backgroundColor: '#F5F5F5',
    }
});

export default AddFriendScreen;
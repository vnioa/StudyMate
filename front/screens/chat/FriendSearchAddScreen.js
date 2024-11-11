// FriendSearchScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Keyboard,
    Alert,
    ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import debounce from 'lodash/debounce';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SEARCH_BAR_HEIGHT = 50;
const CARD_WIDTH = 120;
const CARD_HEIGHT = 160;

const FriendSearchAddScreen = () => {
    // 상태 관리
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [recommendedFriends, setRecommendedFriends] = useState([]);
    const [recentlyAddedFriends, setRecentlyAddedFriends] = useState([]);
    const [showProfilePreview, setShowProfilePreview] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isContactSyncing, setIsContactSyncing] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Refs
    const searchInputRef = useRef(null);
    const scrollViewRef = useRef(null);
    const searchBarAnim = useRef(new Animated.Value(1)).current;
    const qrScanLineAnim = useRef(new Animated.Value(0)).current;

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
                fetchRecentlyAddedFriends()
            ]);
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '화면을 초기화하는데 실패했습니다.');
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

        if (contactsStatus === 'granted') {
            syncContacts();
        }
    };

    // 검색 관련 함수
    const handleSearch = debounce(async (text) => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/friends/search`,
                {
                    params: { query: text },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/friends/qr/${data}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data) {
                setSelectedProfile(response.data);
                setShowProfilePreview(true);
            }
        } catch (error) {
            console.error('QR scan failed:', error);
            Alert.alert('스캔 오류', 'QR 코드 스캔에 실패했습니다.');
        }
    };

    // 스캔 라인 애니메이션
    const startScanLineAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(qrScanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true
                }),
                Animated.timing(qrScanLineAnim, {
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

    // 추천 친구 관련 함수들
    const fetchRecommendedFriends = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/friends/recommended`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRecommendedFriends(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch recommended friends:', error);
            setIsLoading(false);
        }
    };

    // 연락처 동기화 관련 함수들
    const handleContactSync = async () => {
        try {
            if (!isContactSyncing) {
                setIsContactSyncing(true);
                const { status } = await Contacts.requestPermissionsAsync();

                if (status === 'granted') {
                    const { data } = await Contacts.getContactsAsync({
                        fields: [
                            Contacts.Fields.PhoneNumbers,
                            Contacts.Fields.Emails,
                            Contacts.Fields.Name
                        ],
                    });

                    // 연락처 청크 단위로 처리
                    const chunkSize = 100;
                    for (let i = 0; i < data.length; i += chunkSize) {
                        const chunk = data.slice(i, i + chunkSize);
                        await syncContactsChunk(chunk);
                    }

                    Alert.alert('성공', '연락처 동기화가 완료되었습니다.');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            }
        } catch (error) {
            console.error('Contact sync failed:', error);
            Alert.alert('오류', '연락처 동기화에 실패했습니다.');
        } finally {
            setIsContactSyncing(false);
        }
    };

    const syncContactsChunk = async (contacts) => {
        const token = await AsyncStorage.getItem('userToken');
        await axios.post(
            `${API_URL}/api/contacts/sync`,
            { contacts },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    // 친구 추가 관련 함수들
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 친구 목록 새로고침
            fetchRecommendedFriends();
        } catch (error) {
            console.error('Failed to add friend:', error);
            Alert.alert('오류', '친구 추가에 실패했습니다.');
        }
    };

    // 초대하기 기능
    const handleInvite = async () => {
        try {
            const result = await Share.share({
                message: `${user.name}님이 StudyMate에 초대했습니다.\n다운로드: [앱 스토어 링크]`,
                title: 'StudyMate 초대'
            });

            if (result.action === Share.sharedAction) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Share invitation failed:', error);
            Alert.alert('오류', '초대 링크 공유에 실패했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 검색바 및 QR 스캔 버튼 */}
            {renderSearchBar()}

            {/* 추천 친구 섹션 */}
            {renderRecommendedFriends()}

            {/* 최근 연락처 섹션 */}
            {renderRecentContacts()}

            {/* 하단 연락처 동기화 및 초대하기 버튼 */}
            <View style={styles.footer}>
                <View style={styles.syncContainer}>
                    <Text style={styles.syncText}>연락처 동기화</Text>
                    <Switch
                        value={isContactSync}
                        onValueChange={handleContactSync}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isContactSync ? '#2196F3' : '#f4f3f4'}
                        disabled={isContactSyncing}
                    />
                </View>
                <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={handleInvite}
                >
                    <Text style={styles.inviteButtonText}>친구 초대하기</Text>
                </TouchableOpacity>
            </View>

            {/* QR 스캐너 모달 */}
            {renderQRScanner()}

            {/* 프로필 미리보기 모달 */}
            {renderProfilePreview()}

            {/* 로딩 인디케이터 */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2196F3" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // ... 이전 스타일에 이어서
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    syncContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
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
});

export default AddFriendScreen;
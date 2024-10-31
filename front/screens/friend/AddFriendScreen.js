import {useState, useEffect, useCallback, useRef} from "react";
import {
    View,
    Text,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    Switch,
    Platform,
    Dimensions,
    Animated,
    KeyboardAvoidingView,
    ActivityIndicator,
    Alert,
    StyleSheet, AccessibilityInfo
} from "react-native";
import {MaterialIcons} from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import {BarCodeScanner} from "expo-barcode-scanner";
import * as Speech from 'expo-speech';
import {Audio} from 'expo-av';
import FastImage from 'react-native-fast-image';
import {GestureHandlerRootView, PanGestureHandler} from "react-native-gesture-handler";
import SkeletonContent from 'react-native-skeleton-content';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Progress from 'react-native-progress';
import {useDispatch, useSelector} from "react-redux";
import {debounce} from 'lodash';
import * as ImageManipulator from 'expo-image-manipulator';

import {CONSTANTS} from '../constants';
import {ShakeDetector} from '../utils/ShakeDetector';
import {validateQRData, processContactData, generateQRToken} from '../utils/helpers';
import {searchUsers, sendFriendRequest, syncContacts} from '../services/api';
import {showNotification} from '../utils/notifications';
import {compressImage} from '../utils/imageUtils';
import {SKELETON_LAYOUTS} from '../constants/skeletonLayouts';
import {playSound} from '../utils/soundUtils';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const ANIMATION_PRESETS = {
    SPRING: {
        tension: 40,
        friction: 7,
        useNativeDriver: true
    },
    TIMING: {
        duration: 300,
        useNativeDriver: true
    }
};

const AddFriendScreen = () => {
    const dispatch = useDispatch();
    const {user, searchCache} = useSelector(state => state.friend);

    const [states, setStates] = useState({
        searchQuery: '',
        searchResults: [],
        recommendedFriends: [],
        recentContacts: [],
        suggestedQueries: [],
        contactSyncProgress: 0,
        lastSync: null,
        errorState: null
    });

    const [uiStates, setUiStates] = useState({
        isLoading: false,
        showScanner: false,
        searchBarFocused: false,
        syncContacts: false,
        colorBlindMode: false,
        keyboardVisible: false,
        showSkeleton: false,
        isRefreshing: false
    });

    const [processStates, setProcessStates] = useState({
        isSearching: false,
        isScanning: false,
        isSyncing: false,
        processingQR: false,
        uploadingContacts: false,
        pendingRequests: new Set()
    });

    const animations = {
        searchBar: useRef(new Animated.Value(1)).current,
        loading: useRef(new Animated.Value(0)).current,
        scanner: useRef(new Animated.Value(0)).current,
        scanLine: useRef(new Animated.Value(0)).current,
        springEffect: useRef(new Animated.Value(1)).current,
        fadeIn: useRef(new Animated.Value(0)).current,
        shake: useRef(new Animated.Value(0)).current,
        cardScale: useRef(new Animated.Value(1)).current,
    };

    const refs = {
        searchInput: useRef(null),
        scrollView: useRef(null),
        scanner: useRef(null),
        confetti: useRef(null),
        shakeDetector: useRef(null),
        successSound: useRef(null),
        searchTimeout: useRef(null),
        syncTimeout: useRef(null),
        panResponder: useRef(null),
        contacts: useRef(new Map()),
        imageCache: useRef(new Map()),
        qrCodes: useRef(new Set()),
    };

    const [permissions, setPermissions] = useState({
        camera: null,
        contacts: null,
        microphone: null,
        notifications: null,
        storage: null
    });

    useEffect(() => {
        initializeApp();
        return () => cleanup();
    }, []);

    useEffect(() => {
        if(uiStates.showScanner) {
            startScannerAnimation();
        }
    }, [uiStates.showScanner]);

    useEffect(() => {
        if(processStates.isSyncing){
            showSyncProgress();
        }
    }, [processStates.isSyncing]);

    const initializeApp = async() => {
        setUiStates(prev => ({...prev, isLoading: true}));

        try{
            await Promise.all([
                checkAndRequestPermissions(),
                initializeServices(),
                preloadResources()
            ]);

            setupEventListeners();
            startInitialAnimations();
            await loadInitialData();
        }catch(error){
            handleError(error);
        }finally{
            setUiStates(prev => ({...prev, isLoading: false}));
        }
    };

    const checkAndRequestPermissions = async() => {
        try{
            const results = await Promise.all([
                BarCodeScanner.requestPermissionsAsync(),
                Contacts.requestPermissionsAsync(),
                Audio.requestPermissionsAsync(),
                requestStoragePermission()
            ]);

            const newPermissions = {
                camera: results[0].status === 'granted',
                contacts: results[1].status === 'granted',
                microphone: results[2].status === 'granted',
                storage: results[3]
            };

            setPermissions(newPermissions);
            validateRequiredPermissions(newPermissions);

            return newPermissions;
        }catch(error){
            throw new Error('Permission check failed: ' + error.message);
        }
    };

    const initializeServices = async () => {
        try{
            refs.shakeDetector.current = new ShakeDetector({
                threshold: 2.5,
                debounceMs: 500
            });

            refs.shakeDetector.current.addEventListener('shake', handleShake);

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false
            });

            setupPanResponder();
        }catch(error){
            throw new Error('Service initialization failed: ' + error.message);
        }
    };

    const preloadResources = async () => {
        try{
            const imagesToPreload = [
                require('../assets/images/default-profile.png'),
                require('../assets/images/default-contact.png'),
                require('../assets/images/qr-frame.png')
            ];

            await Promise.all([
                FastImage.preload(imagesToPreload.map(img => ({uri: img}))),
                loadSounds(),
                cacheInitialData()
            ]);
        }catch(error){
            console.warn('Resource preload warning: ', error);
        }
    };

    const handleSearch = useCallback(
        debounce(async (query) => {
            if(!query.trim()){
                resetSearchState();
                return;
            }

            setProcessStates(prev => ({
                ...prev, isSearching: true
            }));
            showSkeletonLoader();

            try{
                const cachedResults = refs.searchCache?.curent?.get(query);
                if(cachedResults?.timestamp > Date.now() - CONSTANTS.CACHE_DURATION){
                    updateSearchResults(cachedResults.data);
                    return;
                }

                const [results, suggestions] = await Promise.all([
                    searchUsers(query),
                    fetchSuggestedQueries(query)
                ]);

                updateSearchResults(results);
                updateStates({
                    suggestedQueries: suggestions
                });

                refs.searchCache.current?.set(query, {
                    data: results,
                    timestamp: Date.now()
                });

                dispatch({
                    type: 'UPDATE_SEARCH_CACHE',
                    payload: {
                        query,
                        data: results,
                        timestamp: Date.now()
                    }
                });
            }catch(error){
                handleError(error);
                resetSearchState();
            }finally{
                setProcessStates(prev => ({...prev, isSearching: false}));
                hideSkeletonLoader();
            }
        }, CONSTANTS.DEBOUNCE_DELAY),
        [searchCache]
    );

    const handleQRCodeScanned = async({type, data}) => {
        if(processStates.processingQR){
            return;
        }
        setProcessStates(prev => ({...prev, processingQR: true}));
        startScannerAnimation();

        try{
            const qrData = JSON.parse(data);
            await validateQRData(qrData);

            if(refs.qrCodes.current.has(qrData.token)){
                throw new Error('이미 사용된 QR 코드입니다.');
            }

            const verificationResult = await verifyQRCode(qrData);
            if(!verificationResult.valid){
                throw new Error(verificationResult.message);
            }

            await sendFriendRequest(qrData.userId);

            refs.qrCodes.current.add(qrData.token);

            await playSuccessSound();
            showSuccessAnimation();
            showNotification('친구 추가 성공', '친구 요청을 보냈습니다,');
        }catch(error){
            handleError(error);
            showErrorAnimation();
        }finally{
            setProcessStates(prev => ({...prev, processingQR: false}));
        }
    };

    const handleContactSync = async(value) => {
        if(!permissions.contacts) {
            Alert.alert(
                '권한 필요',
                '연락처 접근 권한이 필요합니다.',
                [
                    {text: '취소', style: 'cancel'},
                    {text: '설정으로 이동', onPress: openSettings}
                ]
            );
            return;
        }

        setUiStates(prev => ({...prev, syncContacts: value}));
        if(!value){
            clearContactSync();
            return;
        }

        setProcessStates(prev => ({...prev, isSyncing: true}));
        updateStates({contactSyncProgress: 0});

        try{
            const contacts = await loadContacts();
            const processedContacts = await processContactsInChunks(contacts);
            await syncContactsWithServer(processedContacts);

            updateStates({
                recentContacts: processedContacts.slice(0,9),
                lastSync: Date.now(),
                contactSyncProgress: 100
            });

            showNotification('동기화 완료', '연락처 동기화가 완료되었습니다.');
        }catch(error){
            handleError(error);
            setUiStates(prev => ({...prev, syncContacts: false}));
        }finally{
            setProcessStates(prev => ({...prev, isSyncing: false}));
        }
    };

    const setupPanResponder = () => {
        refs.panResponder.current = PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: Animated.event(
                [null, {dx: animations.shake}],
                {useNativeDriver: true}
            ),
            onPanResponderRelease: (_, gestureState) => {
                handleSwipeComplete(gestureState);
            }
        });
    };

    const handleSwipeComplete = (gestureState) => {
        const {dx, vx} = gestureState;
        const swipeThreshold = SCREEN_WIDTH * 0.3;

        if(Math.abs(dx) > swipeThreshold || Math.abs(vs) > 0.5){
            if(dx > 0){
                handleSwipeRight();
            } else{
                handleSwipeLeft();
            }
        } else{
            resetCardPosition();
        }
    };

    const startInitialAnimations = () => {
        Animated.parallel([
            Animated.spring(animations.searchBar, {
                toValue: 1,
                ...ANIMATION_PRESETS.SPRING
            }),
            Animated.timing(animations.fadeIn, {
                toValue: 1,
                ...ANIMATION_PRESETS.TIMING
            })
        ]).start();
    };

    const showSuccessAnimation = () => {
        refs.confetti.current?.start();

        Animated.sequence([
            Animated.spring(animations.springEffect, {
                toValue: 1.1,
                tension: 40,
                friction: 7,
                useNativeDriver: true
            }),
            Animated.spring(animations.springEffect, {
                toValue: 1,
                tension: 40,
                friction: 7,
                useNativeDriver: true
            })
        ]).start();
    };

    const startScannerAnimation = () => {
        animations.scanLine.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(animations.scanLine, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true
                }),
                Animated.timing(animations.scanLine, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true
                })
            ])
        ).start();
    };

    const showSkeletonLoader = () => {
        setUiStates(prev => ({...prev, showSkeleton: true}));
        setTimeout(() => {
            setUiStates(prev => ({...prev, showSkeleton: false}));
        },
            CONSTANTS.ANIMATION.SKELETON_DURATION);
    };

    const playSuccessSound = async() => {
        try{
            if(refs.successSound.current){
                await refs.successSound.current.setPositionAsync(0);
                await refs.successSound.current.playAsync();
            }
        }catch(error){
            console.warn('Sound playback warning: ', error);
        }
    };

    const processContactsInChunks = async (contacts) => {
        const CHUNK_SIZE = 100;
        const processedContacts = [];
        const totalContacts = contacts.length;

        for(let i = 0; i < contacts.length; i += CHUNK_SIZE){
            const chunk = contacts.slice(i, i + CHUNK_SIZE);
            const processed = await Promise.all(
                chunk.map(async contact => {
                    const processedContact = await processContactData(contact);
                    updateStates({
                        contactSyncProgress: Math.round(((i + chunk.length) / totalContacts) * 100)
                    });
                    return processedContact;
                })
            );

            processedContacts.push(...processed.filter(Boolean));
        }
        return processedContacts;
    };

    const handleImageProcessing = async(imageUri) => {
        try{
            if(refs.imageCache.current.has(imageUri)){
                return refs.imageCache.current.get(imageUri);
            }

            const processedImage = await compressImage(imageUri, {
                width: 300,
                quality: 0.7
            });

            refs.imageCache.current.set(imageUri, processedImage);
            return processedImage;
        }catch(error){
            console.warn('Image processing warning: ', error);
            return imageUri;
        }
    };

    const handleError = (error, options = {}) => {
        const {silent = false, title = '오류'} = options;
        console.error(`${title}: `, error);

        dispatch({
            type: 'LOG_ERROR',
            payload: {
                error: error.message,
                stack: error.stack,
                timestamp: Date.now(),
                context: 'AddFriendScreen'
            }
        });

        if(!silent){
            const errorMessage = getErrorMessage(error);
            Alert.alert(title, errorMessage, [
                {text: '확인', onPress: () => handleErrorConfirm(error)}
            ]);
        }

        updateStates({errorState: error.code || 'UNKNOWN_ERROR'});
    };

    const updateStates = (newStates) => {
        setStates(prev => ({
            ...prev,
            ...newStates
        }));
    };

    const resetSearchState = () => {
        updateStates({
            searchResults: [],
            suggestQueries: [],
            errorState: null
        });
    };

    const cleanup = () => {
        Object.values(animations).forEach(animation => {
            animation.stopAnimation();
            animation.setValue(0);
        });
        [refs.searchTimeout, refs.syncTimeout].forEach(timeout => {
            if(timeout.current){
                clearTimeout(timeout.current);
            }
        });

        refs.shakeDetector.current?.removeListener();
        refs.successSound.current.unloadAsync();

        [refs.imageCache, refs.searchCache].forEach(cache => {
            cache.current?.clear();
        });
        refs.qrCodes.current?.clear();

        resetAllStates();
    };

    const setupAccessibility = () => {
        if(Platform.OS === 'ios'){
            Speech.speak('친구 추가 화면입니다. 검색하려면 화면을 두 번 탭하세요.');
        }
    };

    const handleAccessibilityAction = (event) => {
        switch(event.nativeEvent.actionName){
            case 'activate':
                refs.searchInput.current?.focus();
                break;
            case 'magicTap':
                setUiStates(prev => ({
                    ...prev, showScanner: true
                }));
                break;
            default:
                break;
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                accessible={true}
                accessibilityLabel="친구 추가 화면"
            >
                {/* 상단 검색 영역 */}
                <View style={styles.searchContainer}>
                    <Animated.View
                        style={[styles.searchBarWrapper, {
                            transform: [{scale: animations.searchBar}],
                            height: 50,
                            width: SCREEN_WIDTH * 0.9,
                            borderRadius: 25
                        }
                    ]}>
                        <TextInput
                            ref={refs.searchInput}
                            style={[styles.searchBar, {fontFamily: 'SFProText-Regular'}]}
                            placeholder="ID 또는 전화번호로 검색"
                            placeholderTextColor="#757575"
                            value={searchQuery}
                            onChangeText={handleSearch}
                            onFocus={() => setSearchBarFocused(true)}
                            onBlur={() => setSearchBarFocused(false)}
                            accessible={true}
                            accessibilityLabel="검색창"
                            accessibilityHing="ID나 전화번호로 친구를 검색하세요"
                        ></TextInput>
                        {isLoading && (
                            <SkeletonPlaceholder
                                speed={0.5}
                                backgroundColor="#F5F5F5"
                                hightlightColor="#E0E0E0"
                            >
                                <View style={styles.searchSkeleton}/>
                            </SkeletonPlaceholder>
                        )}

                    </Animated.View>
                    <TouchableOpacity
                        style={[styles.qrButton, {width: 40, height: 40}]}
                        onPress={() => setShowScanner(true)}
                        accessible={true}
                        accessibilityLabel="QR 코드 스캔"
                        accessibilityHint="QR 코드를 스캔하여 친구를 추가합니다"
                    >
                        <MaterialIcons
                            name="qr-code-scanner"
                            size={24}
                            color="#2196F3"
                            style={{fontWeight: '200'}}
                        />
                    </TouchableOpacity>
                </View>

                {/* 메인 콘텐츠 영역 */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.mainContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {/* 검색 결과 섹션 */}
                    {searchResults.length > 0 && (
                        <Animated.View
                            style={[styles.searchResultsSection, {opacity: animations.fadeIn}]}
                        >
                            <Text style={[styles.sectionTitle, {fontFamily: 'SFProDisplay-Bold', fontSize: 20}]}>검색 결과</Text>
                            {searchResults.map(user => (
                                <TouchableOpacity
                                    key={user.id}
                                    style={styles.searchResultItem}
                                    onPress={() => handleFriendRequest(user.id)}
                                    accessible={true}
                                    accessibilityLabel={`${user.name}의 프로필`}
                                >
                                    <FastImage
                                        source={{uri: user.profileImage}}
                                        style={styles.searchResultImage}
                                        defaultSource={require('../assets/default-profile.png')}
                                    />
                                    <View
                                        style={styles.searchResultInfo}
                                    >
                                        <Text style={[styles.userName, {fontFamily: 'SFProText-Medium', fontSize: 16}]}>{user.name}</Text>
                                        <Text style={[styles.userInfo, {fontFamily: 'SFProText-Regular', fontSize: 14}]}>{user.userId}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </Animated.View>
                    )}
                    {/* 추천 친구 섹션 */}
                    <View style={styles.recommendedSection}>
                        <Text style={[styles.sectionTitle, {fontFamily: 'SFProDisplay-Bold', fontSize: 20}]}>추천 친구</Text>
                        <GestureHandlerRootView>
                            <PanGestureHandler
                                onGestureEvent={handleGesture}
                                activeOffsetX={[-20,20]}
                            >
                                <Animated.ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.recommendedScrollView}
                                    decelerationRate="fast"
                                    snapToInterval={120 + 10} // 카드 너비 + 마진
                                >
                                    {recommendedFriends.map(friend => (
                                        <Animated.View
                                            key={friend.id}
                                            style={[styles.recommendedCard, {width: 120, height: 160, transform: [
                                                    {scale: friend.scale},
                                                    {translateX: friend.translateX}
                                                ]}
                                            ]}
                                        >
                                            <TouchableOpacity
                                                onPress={() => handleFriendRequest(friend.id)}
                                                onLongPress={() => showFriendPreview(friend)}
                                                displayLongPress={500}
                                                accessible={true}
                                                accessibilityLabel={`${friend.name}의 추천 카드`}
                                                accessibilityHint="길게 눌러서 상세 정보를 확인하세요"
                                            >
                                                <FastImage
                                                    source={{uri: friend.profileImage}}
                                                    style={styles.recommendedImage}
                                                    defaultSource={require('../assets/default-profile.png')}
                                                />
                                                <Text style={[styles.recommendedName, {fontFamily: 'SFProText-Medium', fontSize: 16}]}>{friend.name}</Text>
                                                <Text style={[styles.mutualFriends, {fontFamily: 'SFProText-Regular', fontSize: 14}]}>함께 아는 친구 {friend.mutualFriends}명</Text>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    ))}
                                </Animated.ScrollView>
                            </PanGestureHandler>
                        </GestureHandlerRootView>
                    </View>
                    {/* 최근 연락처 섹션 */}
                    <View style={styles.recentContactsSection}>
                        <Text style={[styles.sectionTitle, {fontFamily: 'SFProDisplay-Bold', fontSize: 20}]}>최근 연락처</Text>
                        <View style={styles.contactsGrid}>
                            {isLoading ? (
                                <SkeletonContent
                                    containerStyle={styles.skeletonContainer}
                                    isLoading={true}
                                    layout={SKELETON_LAYOUT}
                                    duration={500}
                                    animationType="shiver"
                                />
                            ) : (
                                recentContacts.map(contact => (
                                    <TouchableOpacity
                                        key={contact.id}
                                        style={styles.contactItem}
                                        onPress={() => handleContactSelection(contact)}
                                        accessible={true}
                                        accessibilityLabel={`${contact,name}의 연락처`}
                                    >
                                        <FastImage
                                            source={
                                                contact.image
                                                ? {uri: contact.image}
                                                    : require('../assets/default-contact.png')
                                            }
                                            style={styles.contactImage}
                                        />
                                        <Text style={[styles.contactName, {fontFamily: 'SFProText-Regular', fontSize: 14}]}>{contact.name}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>
                {/* 하단 영역 */}
                <View style={styles.bottomSection}>
                    <View style={styles.syncContainer}>
                        <Text style={[styles.syncText, {fontFamily: 'SFProText-Regular', fontSize: 14}]}>연락처 동기화</Text>
                        <Switch
                            value={syncContacts}
                            onValueChange={handleContactSync}
                            trackColor={{false: '#757575', true: '#2196F3'}}
                            thumbColor={syncContacts ? '#FFFFFF' : '#F5F5F5'}
                            accessible={true}
                            accessibilityLabel="연락처 동기화 스위치"
                            acessibilityHint="연락처 동기화를 켜거나 끕니다"
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.inviteButton, {height: 50, width: SCREEN_WIDTH * 0.9}]}
                        onPress={handleInvite}
                        accessible={true}
                        accessibilityLabel="친구 초대하기 버튼"
                    >
                        <Text style={[styles.inviteButtonText, {fontFamily: 'SFProText-Medium', fontSize: 16}]}>친구 초대하기</Text>
                    </TouchableOpacity>
                </View>

                {/* QR 코드 스캐너 모달 */}
                <Modal
                    visible={showScanner}
                    animationType="slide"
                    onRequestClose={() => setShowScanner(false)}
                    transparent={false}
                >
                    <View style={styles.scannerContainer}>
                        <BarCodeScanner
                            onBarCodeScanned={handleQRCodeScanned}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Animated.View
                            style={[
                                styles.scanLine,
                                {
                                    transform: [{
                                        translateY: animations.scanLine.interpolate({
                                            inputRange: [0,1],
                                            outputRange: [0,300]
                                        })
                                    }]
                                }
                            ]}
                        />
                        <TouchableOpacity
                            style={styles.closeScannerButton}
                            onPress={() => setShowScanner(false)}
                            accessible={true}
                            accessibilityLabel="스캐너 닫기"
                        >
                            <MaterialIcons
                                name="close"
                                size={24}
                                color="#FFFFFF"
                                style={{fontWeight: '200'}}
                            />
                        </TouchableOpacity>
                    </View>
                </Modal>

                {/* 연락처 동기화 진행률 */}
                {isSyncing && (
                    <View
                        style={styles.syncProgressContainer}
                        accessible={true}
                        accessibilityLabel={`동기화 진행률 ${Math.round(syncProgress * 100)}%`}
                    >
                        <Progress.Bar
                            progress={syncProgress}
                            width={SCREEN_WIDTH * 0.9}
                            color="#2196F3"
                            animated={true}
                        />
                        <Text style={[styles.syncProgressText, {fontFamily: 'SFProText-Regular', fontSize: 14}]}>{`${Math.round(syncProgress * 100)}%`}</Text>
                    </View>
                )}

                {/* 컨페티 애니메이션 */}
                <ConfettiCannon
                    ref={confettiRef}
                    count={200}
                    origin={{x: -10, y: 0}}
                    autoStart={false}
                    fadeOut={true}
                    fallSpeed={3000}
                    explosionSpeed={350}
                    colors={['#2196F3', '#FF4081', '#FFC107']}
                />

                {/* 색맹 모드 토글 */}
                <AccessibilityFeatures
                    colorBlindMode={colorBlindMode}
                    onToggle={handleColorBlindToggle}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
    // 기본 컨테이너
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        ...Platform.select({
            ios: {
                paddingBottom: getBottomSpace()
            },
            android: {
                paddingBottom: 16
            }
        })
    },

    // 검색 영역
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 8,
        height: 50,
        paddingHorizontal: 16,
        zIndex: 1
    },
    searchBarWrapper: {
        flex: 1,
        height: 50,
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3
            }
        })
    },
    searchBar: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        fontFamily: 'SFProText-Regular',
        color: '#333333',
        padding: 0,
        includeFontPadding: false
    },
    searchBarFocused: {
        backgroundColor: '#E0E0E0',
        borderWidth: 1,
        borderColor: '#2196F3'
    },
    searchIndicator: {
        marginLeft: 8,
        transform: [{ scale: 0.8 }]
    },
    clearButton: {
        padding: 8,
        marginLeft: 4
    },
    qrButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4
            },
            android: {
                elevation: 3
            }
        })
    },

    // 스켈레톤 스크린 레이아웃
    skeletonLayouts: {
        searchResult: {
            height: 60,
            borderRadius: 12,
            marginBottom: 8,
            backgroundColor: '#F5F5F5'
        },
        recommendedCard: {
            width: 120,
            height: 160,
            borderRadius: 12,
            marginRight: 10,
            backgroundColor: '#F5F5F5'
        },
        contactItem: {
            width: 60,
            height: 60,
            borderRadius: 30,
            marginBottom: 8,
            backgroundColor: '#F5F5F5'
        }
    },

    // 검색 결과 섹션
    searchResultsSection: {
        marginBottom: 24,
        opacity: 0,
        transform: [{ translateY: 20 }]
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2
            },
            android: {
                elevation: 2
            }
        })
    },
    searchResultItemPressed: {
        backgroundColor: '#F5F5F5',
        transform: [{ scale: 0.98 }]
    },

    // 추천 친구 섹션
    recommendedSection: {
        marginBottom: 24
    },
    recommendedScrollView: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
        overflow: 'visible'
    },
    recommendedCard: {
        width: 120,
        height: 160,
        marginRight: 10,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4
            },
            android: {
                elevation: 3
            }
        })
    },
    recommendedCardGesture: {
        transform: [{
            rotate: Animated.multiply(
                shake,
                new Animated.Value(0.05)
            ).interpolate({
                inputRange: [-1, 1],
                outputRange: ['-5deg', '5deg']
            })
        }]
    },
    recommendedCardPressed: {
        transform: [{ scale: 0.95 }],
        backgroundColor: '#F5F5F5'
    },

    // 최근 연락처 섹션
    contactsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
        alignItems: 'flex-start'
    },
    contactItem: {
        width: (SCREEN_WIDTH - 64) / 3,
        marginHorizontal: 8,
        marginBottom: 16,
        alignItems: 'center'
    },
    contactItemPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }]
    },

    // 애니메이션 스타일
    animations: {
        fadeIn: {
            opacity: fadeAnim
        },
        slideUp: {
            transform: [{
                translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                })
            }]
        },
        scanLine: {
            transform: [{
                translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 300]
                })
            }]
        },
        springEffect: {
            transform: [{
                scale: springAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                })
            }]
        }
    },

    // QR 스캐너 모달
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000000'
    },
    scanFrame: {
        width: SCREEN_WIDTH * 0.7,
        height: SCREEN_WIDTH * 0.7,
        borderWidth: 2,
        borderColor: '#2196F3',
        borderRadius: 12
    },
    scanLine: {
        height: 2,
        width: '100%',
        backgroundColor: '#2196F3',
        opacity: 0.8
    },
    scannerCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight + 10,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    // 접근성 스타일
    accessibility: {
        colorBlind: {
            primary: '#0066CC',
            secondary: '#FF8800',
            text: {
                primary: '#000000',
                secondary: '#666666'
            }
        },
        highContrast: {
            background: '#FFFFFF',
            text: '#000000',
            border: '#000000'
        },
        largeText: {
            title: 24,
            subtitle: 20,
            body: 18
        },
        focus: {
            borderWidth: 2,
            borderColor: '#2196F3'
        }
    },

    // 반응형 스타일
    responsive: {
        tablet: {
            container: {
                maxWidth: 800,
                alignSelf: 'center'
            },
            recommendedCard: {
                width: 160,
                height: 200
            },
            contactsGrid: {
                width: (SCREEN_WIDTH - 96) / 4
            }
        },
        landscape: {
            container: {
                flexDirection: 'row'
            },
            mainContent: {
                flex: 2
            },
            sideContent: {
                flex: 1
            }
        }
    },

    // 상태 스타일
    states: {
        error: {
            borderColor: '#FF3B30',
            borderWidth: 1
        },
        success: {
            borderColor: '#34C759',
            borderWidth: 1
        },
        disabled: {
            opacity: 0.5
        },
        loading: {
            opacity: 0.7
        }
    },

    // 기타 유틸리티 스타일
    utils: {
        shadow: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4
                },
                android: {
                    elevation: 3
                }
            })
        },
        hidden: {
            display: 'none'
        }
    }
});

export default AddFriendScreen;
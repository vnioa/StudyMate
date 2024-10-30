import {useState, useEffect, useCallback, useRef} from "react";
import {Alert, Platform, Animated, Dimensions, Keyboard} from "react-native";
import * as Contacts from 'expo-contacts';
import {BarCodeScanner} from "expo-barcode-scanner";
import * as Speech from 'expo-speech';
import {Audio} from 'expo-av';
import {debounce} from 'lodash';
import {useDispatch, useSelector} from "react-redux";
import FastImage from 'react-native-fast-image';
import * as Notifications from 'expo-notifications';
import {elasticsearch} from '../services/elasticsearch';
import {worker} from '../workers/recommendationWorker';
import {ShakeDetector} from '../utils/ShakeDetector';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SEARCH_BAR_HEIGHT = 50;
const SEARCH_BAR_WIDTH = SCREEN_WIDTH * 0.9;
const QR_BUTTON_SIZE = 40;
const CARD_SIZE = {width: 120, height: 160};
const ANIMATION_DURATION = {
    searchBar: 300,
    scanner: 400,
    confetti: 1000,
    transition: 500
};

const AddFriendScreen = () => {
    const dispatch = useDispatch();
    const {user, searchCache} = useSelector(state => state.friend);

    // UI States
    const [uiState, setUiState] = useState({
        searchQuery: '',
        searchResults: [],
        suggestedQueries: [],
        recommendeFriends: [],
        recentContacts: [],
        isLoading: false,
        showScanner: false,
        showKeyboard: false,
        searchBarFocused: false,
        contactSyncProgress: 0
    });

    // Processing States
    const [processState, setProcessState] = useState({
        isSearching: false,
        isScanning: false,
        isSyncing: false,
        processingQR: false,
        uploadingContacts: false
    });

    // Animations
    const animations = {
        searchBar: useRef(new Animated.Value(1)).current,
        loading: useRef(new Animated.Value(0)).current,
        scanner: useRef(new Animated.Value(0)).current,
        confetti: useRef(null),
        scanLine: useRef(new Animated.Value(0)).current,
        springEffect: useRef(new Animated.Value(1)).current
    };

    // Refs
    const refs = {
        searchInput: useRef(null),
        scrollView: useRef(null),
        contactsList: useRef(null),
        workerInstance: useRef(null),
        elasticSearch: useRef(null),
        shakeDetector: useRef(null),
    };

    // Permissions
    const [permissions, setPermissions] = useState({
        camera: null,
        contacts: null,
        microphone: null,
        notifications: null
    });

    // Cache
    const cache = {
        images: new Map(),
        searchResults: new Map(),
        qrCodes: new Set()
    };

    useEffect(() => {
        initializeApp();
        return () => cleanup();
    }, []);

    const initializeApp = async () => {
        try{
            await initializeServices();
            await checkAndRequestPermissions();
            await loadInitialData();
            setupEventListeners();
            startAnimations();
        }catch(error){
            handleError(error);
        }
    };

    const initializeSrvices = async () => {
        // Elasticsearch 초기화
        refs.elasticSearch.current = await elasticsearch.initialize({
            node: process.env.ELASTICSEARCH_URL,
            auth: {apiKey: process.env.ELASTICSEARCH_API_KEY}
        });

        // Web Worker 초기화
        refs.workerInstance.current = new worker();
        refs.workerInstance.current.onmessage = handleWorkerMessage;

        // ShakeDetector 초기화
        refs.shakeDetector.current = new ShakeDetector();

        refs.shakeDetector.current.addEventListener('shake', handleShake);
    };

    const checkAndRequestPermissions = async () => {
        const permissionResults = await Promise.all([
            BarCodeScanner.requestPermissionsAsync(),
            Contacts.requestPermissionsAsync(),
            Audio.requestPermissionsAsync(),
            Notifications.requestPermissionsAsync()
        ]);

        setPermissions({
            camera: permissionResults[0].status === 'granted',
            contacts: permissionResults[1].status === 'granted',
            microphone: permissionResults[2].status === 'granted',
            notifications: permissionResults[3].status === 'granted'
        });
    };

    const loadInitialData = async () => {
        setUiState(prev => ({...prev, isLoading: true}));

        try{
            const [recomendedFriends, recentContacts] = await Promise.all([
                loadRecommendedFriends(),
                loadRecentContacts(),
                preloadImages()
            ]);

            setUiState(prev => ({
                ...prev,
                recommendeFriends,
                recentContacts,
                isLoading: false
            }));
        }catch(error){
            handleError(error);
        }
    };

    const setupEventListeners = () => {
        Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
        Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    };

    const startAnimations = () => {
        startSearchBarAnimation();
        startScanLineAnimation();
    };

    const handleSearch = useCallback(
        debounce(async (query) => {
            if(!query.trim()){
                updateSearchState({results: [], suggestedQueries: []});
                return;
            }

            setProcessState(prev => ({
                ...prev,
                isSearching: true
            }));
            showSkeletonLoader();

            try{
                const [results, suggestions] = await Promise.all([
                    performElasticSearch(query),
                    getSuggestedQueries(query)
                ]);

                updateSearchState({
                    results: processSearchResults(results),
                    suggestedQueries: suggestions
                });
            }catch(error){
                handleError(error);
            } finally{
                hideSkeletonLoader();
                setProcessState(prev => ({
                    ...prev,
                    isSearching: false
                }));
            }
        }, 300),
        []
    );

    // Elasticsearch 검색 구현
    const performElasticSearch = async (query) => {
        try{
            const response = await refs.elasticSearch.current.search({
                index: 'users',
                body: {
                    query: {
                        bool: {
                            should: [
                                {
                                    multi_match: {
                                        query,
                                        fields: ['username^3', 'nickname^2', 'phoneNumber', 'email'],
                                        fuzziness: 'AUTO',
                                        prefix_length: 2
                                    }
                                },
                                {
                                    term: {
                                        'username.keyboard': {
                                            value: query,
                                            boost: 4
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    suggest: {
                        suggestions: {
                            text: query,
                            term: {
                                field: 'username'
                            }
                        }
                    },
                    size: 20
                }
            });
            return response.hits.hits;
        }catch(error){
            throw new Error('검색 중 오류가 발생했습니다.');
        }
    };

    // QR 코드 스캔 로직
    const handleQRCodeScanned = async({type, data}) => {
        if(processState.processingQR){
            return;
        }

        setProcessState(prev => ({...prev, processingQR: true}));
        startScannerAnimation();

        try{
            const qrData = JSON.parse(data);
            await validateQRData(qrData);

            if(cache.qrCodes.has(qrData.token)){
                throw new Error('이미 사용된 QR 코드입니다.');
            }
            await sendFriendRequest(qrData.userId);
            cache.qrCodes.add(qrData.token);

            await playSuccessSound();
            showSuccessAnimation();
            showNotification('친구 추가 성공', '친구 요청을 보냈습니다.');
        }catch(error){
            handleError(error);
            showErrorAnimation();
        }finally{
            setProcessState(prev => ({...prev, processingQR: false}));
            stopScannerAnimation();
            setUiState(prev => ({...prev, showScanner: false}));
        }
    };

    // 연락처 동기화 로직
    const handleContactSync = async(value) => {
        if(!permissions.contacts){
            Alert.alert('권한 필요', '연락처 접근 권한이 필요합니다.');
            return;
        }

        setProcessState(prev => ({...prev, isSyncing: true}));
        setUiState(prev => ({...prev, contactSyncProgress: 0}));

        try{
            const contacts = await loadContacts();
            const processedContacts = await processContactsForSync(contacts);
            await syncContactWithServer(processedContacts);

            setUiState(prev => ({
                ...prev,
                recentContacts: processedContacts.slice(0,9),
                contactSyncProgress: 100
            }));

            dispatch({
                type: 'UPDATE_CONTACTS_CACHE',
                payload: {
                    contacts: processedContacts,
                    timestamp: Date.now()
                }
            });

            showNotification('동기화 완료', '연락처 동기화가 완료되었습니다.');
        }catch(error){
            handleError(error);
            setUiState(prev => ({...prev, contactSyncProgress: 0}));
        }finally{
            setProcessState(prev => ({...prev, isSyncing: false}));
        }
    };

    // 애니메이션 관련 로직
    const startSearchBarAnimation = () => {
        Animated.spring(animations.searchBar, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true
        }).start();
    };

    const startScanLineAnimation = () => {
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

    const showSuccessAnimation = () => {
        animations.confetti.current?.start();
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

    // 접근성 관련 로직
    const setupAccessibility = () => {
        if(Platform.OS === 'ios') {
            Speech.speak('친구 추가 화면입니다. 검색하려면 화면을 두 번 탭하세요.');
        }
    };

    const handleVoiceCommand = async () => {
        if(!permissions.microphone){
            Alert.alert('권한 필요', '마이크 접근 권한이 필요합니다.');
            return;
        }

        try{
            const result = await Speech.startListeningAsync({
                partialResults: true,
                onPartialResults: handlePartialVoiceResults
            });

            if(result.transcripts.length > 0){
                handleSearch(result.transcripts[0]);
            }
        }catch(error){
            handleError(error);
        }
    };

    // 성능 최적화 관려 로직
    const preloadImages = async () => {
        const imagesToPreload = recommendedFriends.slice(0,5).map(friend => friend.profileImage);
        await FastImage.preload(imagesToPreload.map(uri => ({uri})));
    };

    const handleShake = () => {
        loadRandomRecommendations();
    };

    // 유틸리티 함수들
    const handleError = (error, title = '오류') => {
        console.error(`${title}: `, error);

        dispatch({
            type: 'LOG_ERROR',
            payload: {
                error: error.message,
                stack: error.stack,
                timestamp: Date.now()
            }
        });
        Alert.alert(title, error.message || '오류가 발생했습니다.');
    };

    const cleanup = () => {
        refs.workerInstance.current?.terminate();
        refs.shakeDetector.current?.removeEventListener('shake', handleShake);
        Keyboard.removeAllListeners('keyboardDidShow');
        Keyboard.removeAllListeners('keyboardDidHide');
        animations.scanLine.stopAnimation();
        cache.images.clear();
        cache.searchResults.clear();
        cache.qrCodes.clear();
    };

    return(
        <></>
    )
}

export default AddFriendScreen;
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
    cosnt dispatch = useDispatch();
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
    const ahndleQRCodeScanned = async({type, data}) => {
        if(processState.processingQR){
            return;
        }

        setProcessState(prev => ({...prev, processingQR: true}));
        startScannerAnimation();

        try{

        }catch(error){
            
        }
    }
}
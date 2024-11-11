// FileMediaShareScreen.js

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
    Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import { BlurView } from '@react-native-community/blur';
import { ResumableUploader } from '../utils/resumableUploader';
import { API_URL } from '../config';
import { formatFileSize, formatDate } from '../utils/formatters';
import { encryptFile, decryptFile } from '../utils/encryption';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMN = 3;
const GRID_SPACING = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - (GRID_COLUMN + 1) * GRID_SPACING) / GRID_COLUMN;

const FileMediaShareScreen = () => {
    // 상태 관리
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'images', 'videos', 'files'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [selectedItems, setSelectedItems] = useState([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [sortOption, setSortOption] = useState('date'); // 'date', 'name', 'size'
    const [filterOptions, setFilterOptions] = useState({
        type: 'all',
        size: 'all',
        date: 'all'
    });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [mediaItems, setMediaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showSortOptions, setShowSortOptions] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Refs
    const searchInputRef = useRef(null);
    const flatListRef = useRef(null);
    const uploaderRef = useRef(null);
    const searchBarAnim = useRef(new Animated.Value(1)).current;
    const actionButtonAnim = useRef(new Animated.Value(0)).current;

    // Navigation
    const navigation = useNavigation();

    // 초기화
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await checkPermissions();
            await fetchMediaItems();
            setupKeyboardListeners();
            initializeUploader();
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '화면을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        cleanupKeyboardListeners();
        uploaderRef.current?.cleanup();
    };

    // 권한 체크
    const checkPermissions = async () => {
        const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
        if (mediaStatus !== 'granted') {
            Alert.alert(
                '권한 필요',
                '미디어 라이브러리 접근 권한이 필요합니다.',
                [
                    { text: '설정으로 이동', onPress: () => Linking.openSettings() },
                    { text: '취소', style: 'cancel' }
                ]
            );
        }
    };

    // 파일 업로더 초기화
    const initializeUploader = () => {
        uploaderRef.current = new ResumableUploader({
            target: `${API_URL}/api/upload`,
            chunkSize: 1 * 1024 * 1024, // 1MB
            simultaneousUploads: 3,
            testChunks: false,
            throttleProgressCallbacks: 1,
            onFileAdded: handleFileAdded,
            onFileSuccess: handleFileSuccess,
            onFileError: handleFileError,
            onProgress: handleUploadProgress
        });
    };
    // 파일 및 미디어 관리 함수들
    const handleFileUpload = async (files) => {
        try {
            setIsLoading(true);
            const uploadPromises = files.map(async (file) => {
                const encryptedFile = await encryptFile(file);
                const formData = new FormData();
                formData.append('file', encryptedFile);

                return uploaderRef.current.upload(formData);
            });

            await Promise.all(uploadPromises);
            fetchMediaItems();
            setIsLoading(false);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('File upload failed:', error);
            setIsLoading(false);
            Alert.alert('업로드 실패', '파일 업로드에 실패했습니다.');
        }
    };

    const handleFileAdded = (file) => {
        // 파일 크기 및 유형 검증
        if (!validateFile(file)) {
            return false;
        }

        // 업로드 진행률 UI 업데이트
        updateUploadProgress(0);
        return true;
    };

    const handleFileSuccess = (file, response) => {
        const fileData = JSON.parse(response);
        dispatch({ type: 'ADD_MEDIA_ITEM', payload: fileData });
        updateUploadProgress(100);
    };

    const handleFileError = (file, error) => {
        console.error('File upload error:', error);
        Alert.alert('오류', '파일 업로드 중 오류가 발생했습니다.');
        updateUploadProgress(0);
    };

    const handleUploadProgress = (progress) => {
        updateUploadProgress(progress);
    };

    const validateFile = (file) => {
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            Alert.alert('파일 크기 초과', '100MB 이하의 파일만 업로드 가능합니다.');
            return false;
        }

        const allowedTypes = ['image', 'video', 'application'];
        const fileType = file.type.split('/')[0];
        if (!allowedTypes.includes(fileType)) {
            Alert.alert('지원하지 않는 파일 형식', '이미지, 비디오, 문서 파일만 업로드 가능합니다.');
            return false;
        }

        return true;
    };

    // 미디어 항목 관리
    const handleMediaSelect = useCallback((itemId) => {
        setSelectedItems(prev => {
            const isSelected = prev.includes(itemId);

            // 선택 효과 애니메이션
            Animated.spring(itemAnimations.current[itemId], {
                toValue: isSelected ? 0 : 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true
            }).start();

            // 햅틱 피드백
            Haptics.impactAsync(
                isSelected ?
                    Haptics.ImpactFeedbackStyle.Light :
                    Haptics.ImpactFeedbackStyle.Medium
            );

            return isSelected ?
                prev.filter(id => id !== itemId) :
                [...prev, itemId];
        });
    }, []);

    const handleMediaShare = async () => {
        if (selectedItems.length === 0) return;

        try {
            const itemsToShare = mediaItems.filter(item =>
                selectedItems.includes(item.id)
            );

            const shareOptions = {
                title: '파일 공유',
                message: '선택한 파일을 공유합니다.',
                urls: itemsToShare.map(item => item.url)
            };

            const result = await Share.share(shareOptions);
            if (result.action === Share.sharedAction) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Share failed:', error);
            Alert.alert('공유 실패', '파일 공유에 실패했습니다.');
        }
    };

    const handleMediaDelete = async () => {
        if (selectedItems.length === 0) return;

        Alert.alert(
            '파일 삭제',
            '선택한 파일을 삭제하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.post(
                                `${API_URL}/api/media/delete`,
                                { ids: selectedItems },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            // 삭제 애니메이션
                            selectedItems.forEach(id => {
                                Animated.timing(itemAnimations.current[id], {
                                    toValue: 0,
                                    duration: 300,
                                    useNativeDriver: true
                                }).start();
                            });

                            setTimeout(() => {
                                setMediaItems(prev =>
                                    prev.filter(item => !selectedItems.includes(item.id))
                                );
                                setSelectedItems([]);
                            }, 300);

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            console.error('Delete failed:', error);
                            Alert.alert('삭제 실패', '파일 삭제에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 필터 및 정렬
    const handleFilterChange = (filterType, value) => {
        setFilterOptions(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const handleSortChange = (option) => {
        setSortOption(option);
        sortMediaItems(option);
    };

    const sortMediaItems = (option) => {
        const sorted = [...mediaItems].sort((a, b) => {
            switch (option) {
                case 'date':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'size':
                    return b.size - a.size;
                default:
                    return 0;
            }
        });

        setMediaItems(sorted);
    };

    // 검색 및 필터링
    const filterMediaItems = useCallback(() => {
        return mediaItems.filter(item => {
            // 검색어 필터링
            if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // 파일 유형 필터링
            if (filterOptions.type !== 'all' && item.type !== filterOptions.type) {
                return false;
            }

            // 파일 크기 필터링
            if (filterOptions.size !== 'all') {
                const size = parseInt(filterOptions.size);
                if (item.size > size * 1024 * 1024) {
                    return false;
                }
            }

            // 날짜 필터링
            if (filterOptions.date !== 'all') {
                const date = new Date();
                date.setDate(date.getDate() - parseInt(filterOptions.date));
                if (new Date(item.createdAt) < date) {
                    return false;
                }
            }

            return true;
        });
    }, [mediaItems, searchQuery, filterOptions]);

    const renderMediaTabs = () => (
        <View style={styles.tabContainer}>
            {MEDIA_TABS.map(tab => (
                <TouchableOpacity
                    key={tab.value}
                    style={[
                        styles.tab,
                        activeTab === tab.value && styles.activeTab
                    ]}
                    onPress={() => setActiveTab(tab.value)}
                >
                    <MaterialIcons
                        name={tab.icon}
                        size={24}
                        color={activeTab === tab.value ? '#4A90E2' : '#757575'}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === tab.value && styles.activeTabText
                    ]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderViewModeToggle = () => (
        <View style={styles.viewModeContainer}>
            <TouchableOpacity
                style={[
                    styles.viewModeButton,
                    viewMode === 'grid' && styles.activeViewMode
                ]}
                onPress={() => setViewMode('grid')}
            >
                <MaterialIcons
                    name="grid-view"
                    size={24}
                    color={viewMode === 'grid' ? '#4A90E2' : '#757575'}
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.viewModeButton,
                    viewMode === 'list' && styles.activeViewMode
                ]}
                onPress={() => setViewMode('list')}
            >
                <MaterialIcons
                    name="view-list"
                    size={24}
                    color={viewMode === 'list' ? '#4A90E2' : '#757575'}
                />
            </TouchableOpacity>
        </View>
    );

    const renderActionButtons = () => (
        <Animated.View
            style={[
                styles.actionButtonsContainer,
                {
                    transform: [{
                        translateY: actionButtonAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0]
                        })
                    }]
                }
            ]}
        >
            <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShare}
                disabled={selectedItems.length === 0}
            >
                <MaterialIcons name="share" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                    공유 ({selectedItems.length})
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
                disabled={selectedItems.length === 0}
            >
                <MaterialIcons name="delete" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>삭제</Text>
            </TouchableOpacity>
        </Animated.View>
    );
    // 미디어 아이템 렌더링
    const renderMediaItem = useCallback(({ item }) => {
        const isSelected = selectedItems.includes(item.id);
        const itemSize = viewMode === 'grid' ? (SCREEN_WIDTH - 48) / 3 : SCREEN_WIDTH - 32;

        return (
            <TouchableOpacity
                style={[
                    styles.mediaItem,
                    viewMode === 'grid' ? styles.gridItem : styles.listItem,
                    isSelected && styles.selectedItem,
                    { width: itemSize }
                ]}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleItemLongPress(item)}
                delayLongPress={500}
            >
                {item.type === 'image' && (
                    <FastImage
                        style={styles.mediaThumbnail}
                        source={{ uri: item.url }}
                        resizeMode={FastImage.resizeMode.cover}
                    />
                )}
                {item.type === 'video' && (
                    <View style={styles.videoContainer}>
                        <FastImage
                            style={styles.mediaThumbnail}
                            source={{ uri: item.thumbnail }}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                        <View style={styles.videoDurationBadge}>
                            <Text style={styles.videoDurationText}>
                                {formatDuration(item.duration)}
                            </Text>
                        </View>
                        <View style={styles.playButton}>
                            <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
                        </View>
                    </View>
                )}
                {item.type === 'file' && (
                    <View style={styles.fileContainer}>
                        <MaterialIcons
                            name={getFileIcon(item.fileType)}
                            size={36}
                            color="#4A90E2"
                        />
                        <Text style={styles.fileName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.fileSize}>
                            {formatFileSize(item.size)}
                        </Text>
                    </View>
                )}
                {isSelected && (
                    <View style={styles.selectedOverlay}>
                        <MaterialIcons name="check-circle" size={24} color="#4A90E2" />
                    </View>
                )}
            </TouchableOpacity>
        );
    }, [viewMode, selectedItems]);

    // 필터 모달 렌더링
    const renderFilterModal = () => (
        <Modal
            isVisible={showFilterModal}
            onBackdropPress={() => setShowFilterModal(false)}
            style={styles.filterModal}
            animationIn="slideInUp"
            animationOut="slideOutDown"
        >
            <View style={styles.filterContainer}>
                <Text style={styles.filterTitle}>필터 및 정렬</Text>

                {/* 파일 유형 필터 */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>파일 유형</Text>
                    <View style={styles.filterOptions}>
                        {FILE_TYPES.map(type => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.filterOption,
                                    filterOptions.type === type.value && styles.filterOptionActive
                                ]}
                                onPress={() => handleFilterChange('type', type.value)}
                            >
                                <MaterialIcons
                                    name={type.icon}
                                    size={24}
                                    color={filterOptions.type === type.value ? '#FFFFFF' : '#333333'}
                                />
                                <Text style={[
                                    styles.filterOptionText,
                                    filterOptions.type === type.value && styles.filterOptionTextActive
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 파일 크기 필터 */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>파일 크기</Text>
                    <View style={styles.filterOptions}>
                        {FILE_SIZES.map(size => (
                            <TouchableOpacity
                                key={size.value}
                                style={[
                                    styles.filterOption,
                                    filterOptions.size === size.value && styles.filterOptionActive
                                ]}
                                onPress={() => handleFilterChange('size', size.value)}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    filterOptions.size === size.value && styles.filterOptionTextActive
                                ]}>
                                    {size.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 날짜 필터 */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>날짜</Text>
                    <View style={styles.filterOptions}>
                        {DATE_RANGES.map(range => (
                            <TouchableOpacity
                                key={range.value}
                                style={[
                                    styles.filterOption,
                                    filterOptions.date === range.value && styles.filterOptionActive
                                ]}
                                onPress={() => handleFilterChange('date', range.value)}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    filterOptions.date === range.value && styles.filterOptionTextActive
                                ]}>
                                    {range.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.applyFilterButton}
                    onPress={() => {
                        applyFilters();
                        setShowFilterModal(false);
                    }}
                >
                    <Text style={styles.applyFilterButtonText}>필터 적용</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 상단 검색바 및 필터 버튼 */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <MaterialIcons
                        name="search"
                        size={24}
                        color="#757575"
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchBar}
                        placeholder="파일 또는 미디어 검색"
                        placeholderTextColor="#757575"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <MaterialIcons name="filter-list" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 미디어 유형 탭 */}
            <View style={styles.tabContainer}>
                {MEDIA_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.value}
                        style={[
                            styles.tab,
                            activeTab === tab.value && styles.activeTab
                        ]}
                        onPress={() => setActiveTab(tab.value)}
                    >
                        <MaterialIcons
                            name={tab.icon}
                            size={24}
                            color={activeTab === tab.value ? '#4A90E2' : '#757575'}
                        />
                        <Text style={[
                            styles.tabText,
                            activeTab === tab.value && styles.activeTabText
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 보기 모드 전환 버튼 */}
            <View style={styles.viewModeContainer}>
                <TouchableOpacity
                    style={[
                        styles.viewModeButton,
                        viewMode === 'grid' && styles.activeViewMode
                    ]}
                    onPress={() => setViewMode('grid')}
                >
                    <MaterialIcons
                        name="grid-view"
                        size={24}
                        color={viewMode === 'grid' ? '#4A90E2' : '#757575'}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.viewModeButton,
                        viewMode === 'list' && styles.activeViewMode
                    ]}
                    onPress={() => setViewMode('list')}
                >
                    <MaterialIcons
                        name="view-list"
                        size={24}
                        color={viewMode === 'list' ? '#4A90E2' : '#757575'}
                    />
                </TouchableOpacity>
            </View>

            {/* 미디어 목록 */}
            <FlatList
                data={filteredMediaItems}
                renderItem={renderMediaItem}
                keyExtractor={item => item.id}
                numColumns={viewMode === 'grid' ? 3 : 1}
                contentContainerStyle={styles.mediaList}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            {/* 하단 작업 버튼 */}
            {selectedItems.length > 0 && (
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        onPress={handleShare}
                    >
                        <MaterialIcons name="share" size={24} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>
                            공유 ({selectedItems.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                    >
                        <MaterialIcons name="delete" size={24} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>삭제</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 필터 모달 */}
            {renderFilterModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    mediaList: {
        padding: 8,
    },
    mediaItem: {
        margin: 4,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    gridItem: {
        width: (SCREEN_WIDTH - 48) / 3,
        aspectRatio: 1,
    },
    listItem: {
        width: SCREEN_WIDTH - 32,
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    mediaThumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoDurationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    videoDurationText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
    },
    fileContainer: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 4,
    },
    fileSize: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        color: '#757575',
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(74, 144, 226, 0.3)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    shareButton: {
        backgroundColor: '#4A90E2',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        marginLeft: 8,
    },
    filterModal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    filterContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
        maxHeight: SCREEN_HEIGHT * 0.7,
    },
    filterTitle: {
        fontSize: 20,
        fontFamily: 'Roboto-Bold',
        color: '#333333',
        marginBottom: 16,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        marginBottom: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginHorizontal: 4,
        marginBottom: 8,
    },
    filterOptionActive: {
        backgroundColor: '#4A90E2',
        borderColor: '#4A90E2',
    },
    filterOptionText: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        marginLeft: 8,
    },
    filterOptionTextActive: {
        color: '#FFFFFF',
    },
    applyFilterButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    applyFilterButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Roboto-Bold',
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
    }
});

export default FileMediaShareScreen;
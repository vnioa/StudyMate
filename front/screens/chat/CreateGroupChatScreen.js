// CreateGroupScreen.js

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
    Image, ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import DraggableFlatList from 'react-native-draggable-flatlist';
import Modal from 'react-native-modal';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import { createGroup } from '../redux/slices/groupSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GROUP_NAME_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 500;
const MIN_MEMBERS = 2;

const CreateGroupChatScreen = () => {
    // 상태 관리
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupIcon, setGroupIcon] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isNameValid, setIsNameValid] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showIconOptions, setShowIconOptions] = useState(false);
    const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

    // Redux
    const dispatch = useDispatch();
    const friends = useSelector(state => state.friends.list);
    const user = useSelector(state => state.auth.user);

    // Refs
    const groupNameInputRef = useRef(null);
    const searchInputRef = useRef(null);
    const memberListRef = useRef(null);
    const createButtonAnim = useRef(new Animated.Value(0)).current;
    const iconMorphAnim = useRef(new Animated.Value(0)).current;

    // Navigation
    const navigation = useNavigation();

    // 애니메이션 값
    const buttonScale = createButtonAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05]
    });

    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await checkPermissions();
            setupKeyboardListeners();
            startButtonPulseAnimation();
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '화면을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        cleanupKeyboardListeners();
    };

    // 권한 체크
    const checkPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                '권한 필요',
                '그룹 아이콘 설정을 위해 갤러리 접근 권한이 필요합니다.',
                [
                    { text: '설정으로 이동', onPress: () => Linking.openSettings() },
                    { text: '취소', style: 'cancel' }
                ]
            );
        }
    };

    // 키보드 이벤트 리스너
    const setupKeyboardListeners = () => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            handleKeyboardShow
        );

        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            handleKeyboardHide
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    };

    const handleKeyboardShow = () => {
        Animated.spring(createButtonAnim, {
            toValue: 0,
            useNativeDriver: true
        }).start();
    };

    const handleKeyboardHide = () => {
        Animated.spring(createButtonAnim, {
            toValue: 1,
            useNativeDriver: true
        }).start();
    };
    // 그룹 이름 검증 및 아이콘 관련 함수들
    const validateGroupName = async (name) => {
        try {
            if (!name.trim()) {
                setIsNameValid(false);
                return false;
            }

            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.post(
                `${API_URL}/api/groups/validate-name`,
                { name },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const isValid = response.data.isValid;
            setIsNameValid(isValid);

            if (!isValid) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('알림', '이미 사용 중인 그룹 이름입니다.');
            }

            return isValid;
        } catch (error) {
            console.error('Group name validation failed:', error);
            return false;
        }
    };

    // 그룹 아이콘 관련 함수
    const handleGroupIconSelect = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setGroupIcon(result.assets[0].uri);
                generateGroupIconPreview(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image selection failed:', error);
            Alert.alert('오류', '이미지 선택에 실패했습니다.');
        }
    };

    const generateGroupIconPreview = async (imageUri) => {
        try {
            setIsGeneratingIcon(true);

            // 선택된 멤버들의 프로필 이미지로 모핑 애니메이션 시작
            Animated.timing(iconMorphAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start();

            // WebAssembly를 사용한 이미지 처리
            const iconData = await processGroupIcon(imageUri, selectedMembers);
            setGroupIcon(iconData);

            setIsGeneratingIcon(false);
        } catch (error) {
            console.error('Icon generation failed:', error);
            setIsGeneratingIcon(false);
            Alert.alert('오류', '그룹 아이콘 생성에 실패했습니다.');
        }
    };

    // 멤버 선택 관련 함수
    const handleMemberSelect = useCallback((memberId) => {
        setSelectedMembers(prev => {
            const isSelected = prev.includes(memberId);

            // 선택 효과 애니메이션
            Animated.spring(memberAnimations.current[memberId], {
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
                prev.filter(id => id !== memberId) :
                [...prev, memberId];
        });
    }, []);

    // 그룹 생성 함수
    const handleCreateGroup = async () => {
        try {
            if (!groupName.trim() || selectedMembers.length < MIN_MEMBERS) {
                Alert.alert('알림', '그룹 이름과 최소 2명의 멤버를 선택해주세요.');
                return;
            }

            if (!(await validateGroupName(groupName))) {
                return;
            }

            setIsLoading(true);

            const formData = new FormData();
            formData.append('name', groupName);
            formData.append('members', JSON.stringify(selectedMembers));

            if (groupIcon) {
                formData.append('icon', {
                    uri: groupIcon,
                    type: 'image/jpeg',
                    name: 'group_icon.jpg'
                });
            }

            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.post(
                `${API_URL}/api/groups`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // 성공 애니메이션 및 피드백
            showSuccessAnimation();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 채팅방으로 자동 이동
            navigation.replace('ChatRoom', {
                chatId: response.data.chatId,
                isNewGroup: true
            });

        } catch (error) {
            console.error('Group creation failed:', error);
            setIsLoading(false);
            Alert.alert('오류', '그룹 생성에 실패했습니다.');
        }
    };

    // 성공 애니메이션
    const showSuccessAnimation = () => {
        // 컨페티 애니메이션
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setShowConfetti(true);

        // 1초 후 컨페티 숨기기
        setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowConfetti(false);
        }, 1000);
    };

    // 렌더링 메서드들
    const renderHeader = () => (
        <View style={styles.header}>
            <TextInput
                ref={groupNameInputRef}
                style={[
                    styles.groupNameInput,
                    !isNameValid && styles.invalidInput
                ]}
                placeholder="그룹 이름 입력"
                placeholderTextColor="#757575"
                value={groupName}
                onChangeText={text => {
                    setGroupName(text);
                    validateGroupName(text);
                }}
                maxLength={30}
            />
            <TouchableOpacity
                style={styles.iconButton}
                onPress={handleGroupIconSelect}
                disabled={isGeneratingIcon}
            >
                {groupIcon ? (
                    <FastImage
                        style={styles.groupIcon}
                        source={{ uri: groupIcon }}
                        defaultSource={require('../../assets/images/icons/user.png')}
                    />
                ) : (
                    <MaterialIcons
                        name="add-photo-alternate"
                        size={24}
                        color="#FFFFFF"
                    />
                )}
                {isGeneratingIcon && (
                    <ActivityIndicator
                        style={styles.iconLoader}
                        color="#FFFFFF"
                    />
                )}
            </TouchableOpacity>
        </View>
    );
    // 렌더링 메서드들 이어서...
    const renderFriendsList = () => (
        <FlatList
            data={friends}
            renderItem={renderFriendItem}
            numColumns={3}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.friendsGrid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            windowSize={5}
            maxToRenderPerBatch={15}
            initialNumToRender={12}
            removeClippedSubviews={Platform.OS === 'android'}
        />
    );

    const renderFriendItem = useCallback(({ item }) => {
        const isSelected = selectedMembers.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.friendItem,
                    isSelected && styles.selectedFriendItem
                ]}
                onPress={() => handleMemberSelect(item.id)}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleMemberLongPress(item);
                }}
                delayLongPress={500}
            >
                <FastImage
                    style={styles.friendImage}
                    source={{
                        uri: item.profileImage,
                        priority: FastImage.priority.normal
                    }}
                    defaultSource={require('../assets/default-profile.png')}
                />
                <Text style={styles.friendName} numberOfLines={1}>
                    {item.name}
                </Text>
                {isSelected && (
                    <View style={styles.checkmarkOverlay}>
                        <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                )}
            </TouchableOpacity>
        );
    }, [selectedMembers]);

    const renderSelectedMembers = () => (
        <View style={styles.selectedMembersContainer}>
            <Text style={styles.selectedCountText}>
                선택된 멤버 ({selectedMembers.length})
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedMembersList}
            >
                {selectedMembers.map((memberId) => {
                    const member = friends.find(f => f.id === memberId);
                    if (!member) return null;

                    return (
                        <View key={member.id} style={styles.selectedMemberItem}>
                            <FastImage
                                style={styles.selectedMemberImage}
                                source={{
                                    uri: member.profileImage,
                                    priority: FastImage.priority.high
                                }}
                                defaultSource={require('../assets/default-profile.png')}
                            />
                            <TouchableOpacity
                                style={styles.removeMemberButton}
                                onPress={() => handleRemoveMember(member.id)}
                            >
                                <MaterialIcons name="close" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="group" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>친구 목록이 비어있습니다</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 상단 바 */}
            <View style={styles.header}>
                <TextInput
                    ref={groupNameInputRef}
                    style={[
                        styles.groupNameInput,
                        !isNameValid && styles.invalidInput
                    ]}
                    placeholder="그룹 이름 입력"
                    placeholderTextColor="#757575"
                    value={groupName}
                    onChangeText={handleGroupNameChange}
                    maxLength={GROUP_NAME_MAX_LENGTH}
                />
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleGroupIconSelect}
                    disabled={isGeneratingIcon}
                >
                    {groupIcon ? (
                        <FastImage
                            style={styles.groupIcon}
                            source={{ uri: groupIcon }}
                            defaultSource={require('../assets/default-group.png')}
                        />
                    ) : (
                        <MaterialIcons
                            name="add-photo-alternate"
                            size={24}
                            color="#FFFFFF"
                        />
                    )}
                    {isGeneratingIcon && (
                        <ActivityIndicator
                            style={styles.iconLoader}
                            color="#FFFFFF"
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* 검색 바 */}
            <View style={styles.searchContainer}>
                <MaterialIcons
                    name="search"
                    size={24}
                    color="#757575"
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder="친구 검색"
                    placeholderTextColor="#757575"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* 친구 목록 */}
            {renderFriendsList()}

            {/* 선택된 멤버 미리보기 */}
            {selectedMembers.length > 0 && renderSelectedMembers()}

            {/* 그룹 생성 버튼 */}
            <TouchableOpacity
                style={[
                    styles.createButton,
                    (!groupName.trim() || selectedMembers.length < MIN_MEMBERS) &&
                    styles.createButtonDisabled
                ]}
                onPress={handleCreateGroup}
                disabled={!groupName.trim() || selectedMembers.length < MIN_MEMBERS}
            >
                <Text style={styles.createButtonText}>
                    그룹 생성 ({selectedMembers.length}명)
                </Text>
            </TouchableOpacity>

            {/* 이미지 선택 모달 */}
            <Modal
                isVisible={showIconOptions}
                onBackdropPress={() => setShowIconOptions(false)}
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={handleTakePhoto}
                    >
                        <MaterialIcons name="camera-alt" size={24} color="#333333" />
                        <Text style={styles.modalOptionText}>사진 촬영</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={handleChooseFromGallery}
                    >
                        <MaterialIcons name="photo-library" size={24} color="#333333" />
                        <Text style={styles.modalOptionText}>갤러리에서 선택</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.modalOption}
                        onPress={handleGenerateGroupIcon}
                    >
                        <MaterialIcons name="auto-awesome" size={24} color="#333333" />
                        <Text style={styles.modalOptionText}>자동 생성</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    groupNameInput: {
        flex: 1,
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 18,
        fontFamily: 'Roboto-Bold',
        color: '#212121',
        marginRight: 16,
    },
    invalidInput: {
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    iconButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    iconLoader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 30,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchIcon: {
        position: 'absolute',
        left: 28,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingLeft: 44,
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
    },
    friendsGrid: {
        padding: 8,
    },
    friendItem: {
        width: (SCREEN_WIDTH - 48) / 3,
        aspectRatio: 1,
        margin: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    selectedFriendItem: {
        backgroundColor: '#E8F5E9',
    },
    friendImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    friendName: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#333333',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    checkmarkOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    selectedMembersContainer: {
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    selectedCountText: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#757575',
        marginLeft: 16,
        marginBottom: 8,
    },
    selectedMembersList: {
        paddingHorizontal: 12,
    },
    selectedMemberItem: {
        marginHorizontal: 4,
    },
    selectedMemberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    removeMemberButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButton: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    createButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    createButtonText: {
        fontSize: 16,
        fontFamily: 'Roboto-Bold',
        color: '#FFFFFF',
    },
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    modalOptionText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        marginLeft: 16,
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
        marginTop: 8,
        textAlign: 'center',
    },
});

export default CreateGroupChatScreen;

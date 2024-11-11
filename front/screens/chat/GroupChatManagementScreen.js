// GroupManagementScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-native-modal';
import { BlurView } from '@react-native-community/blur';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config/api';
import { ROLES } from '../constants';
import * as selectedMember from "date-fns/locale";
import * as PropTypes from "prop-types";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const MEMBER_ITEM_SIZE = (SCREEN_WIDTH - 48) / GRID_COLUMNS;

function JitsiMeeting(props) {
    return null;
}

JitsiMeeting.propTypes = {
    ref: PropTypes.any,
    style: PropTypes.any
};
const GroupManagementScreen = () => {
    // 상태 관리
    const [groupName, setGroupName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [groupImage, setGroupImage] = useState(null);
    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [settings, setSettings] = useState({
        notifications: true,
        mediaAutoDownload: true,
        memberInvite: false
    });
    const [userRole, setUserRole] = useState(ROLES.MEMBER);
    const [isLoading, setIsLoading] = useState(true);

    // Redux
    const dispatch = useDispatch();
    const group = useSelector(state => state.groups.currentGroup);
    const user = useSelector(state => state.auth.user);

    // Refs
    const groupNameInputRef = useRef(null);
    const scrollViewRef = useRef(null);
    const memberGridAnim = useRef(new Animated.Value(1)).current;
    const leaveButtonAnim = useRef(new Animated.Value(1)).current;

    // Navigation
    const navigation = useNavigation();
    const route = useRoute();
    const { groupId } = route.params;

    // 초기화
    useEffect(() => {
        initializeScreen();
        return () => cleanupScreen();
    }, []);

    const initializeScreen = async () => {
        try {
            await Promise.all([
                fetchGroupDetails(),
                fetchMembers(),
                checkUserRole(),
                setupImagePickerPermissions()
            ]);
        } catch (error) {
            console.error('Screen initialization failed:', error);
            Alert.alert('초기화 오류', '화면을 초기화하는데 실패했습니다.');
        }
    };

    const cleanupScreen = () => {
        // 정리 작업
    };

    // 데이터 페칭
    const fetchGroupDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/groups/${groupId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const groupData = response.data;
            setGroupName(groupData.name);
            setGroupImage(groupData.image);
            setSettings(groupData.settings);

            dispatch({ type: 'SET_CURRENT_GROUP', payload: groupData });
        } catch (error) {
            console.error('Failed to fetch group details:', error);
            Alert.alert('오류', '그룹 정보를 불러오는데 실패했습니다.');
        }
    };

    const fetchMembers = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/groups/${groupId}/members`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMembers(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            setIsLoading(false);
            Alert.alert('오류', '멤버 목록을 불러오는데 실패했습니다.');
        }
    };

    const checkUserRole = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(
                `${API_URL}/api/groups/${groupId}/role`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUserRole(response.data.role);
        } catch (error) {
            console.error('Failed to check user role:', error);
        }
    };
    // 그룹 관리 함수들
    const handleGroupNameUpdate = async () => {
        if (!isEditingName || !groupName.trim()) return;

        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
                `${API_URL}/api/groups/${groupId}/name`,
                { name: groupName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setIsEditingName(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to update group name:', error);
            Alert.alert('오류', '그룹 이름 변경에 실패했습니다.');
        }
    };

    const handleGroupImageUpdate = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                const token = await AsyncStorage.getItem('userToken');
                const formData = new FormData();
                formData.append('image', {
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    name: 'group_image.jpg'
                });

                await axios.put(
                    `${API_URL}/api/groups/${groupId}/image`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                setGroupImage(result.assets[0].uri);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error('Failed to update group image:', error);
            Alert.alert('오류', '그룹 이미지 변경에 실패했습니다.');
        }
    };

    // 멤버 관리 함수들
    const handleMemberSelect = useCallback((memberId) => {
        setSelectedMembers(prev => {
            const isSelected = prev.includes(memberId);

            // 선택 효과 애니메이션
            Animated.spring(memberGridAnim, {
                toValue: isSelected ? 1 : 1.05,
                friction: 3,
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

    const handleMemberRole = async (memberId, newRole) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
                `${API_URL}/api/groups/${groupId}/members/${memberId}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMembers(prev =>
                prev.map(member =>
                    member.id === memberId ? { ...member, role: newRole } : member
                )
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to update member role:', error);
            Alert.alert('오류', '멤버 권한 변경에 실패했습니다.');
        }
    };

    const handleRemoveMembers = async () => {
        if (selectedMembers.length === 0) return;

        Alert.alert(
            '멤버 내보내기',
            '선택한 멤버를 그룹에서 내보내시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '내보내기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await Promise.all(
                                selectedMembers.map(memberId =>
                                    axios.delete(
                                        `${API_URL}/api/groups/${groupId}/members/${memberId}`,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                    )
                                )
                            );

                            setMembers(prev =>
                                prev.filter(member => !selectedMembers.includes(member.id))
                            );
                            setSelectedMembers([]);
                            setIsMultiSelectMode(false);

                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            console.error('Failed to remove members:', error);
                            Alert.alert('오류', '멤버 내보내기에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 설정 관리 함수들
    const handleSettingToggle = async (setting) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
                `${API_URL}/api/groups/${groupId}/settings/${setting}`,
                { value: !settings[setting] },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSettings(prev => ({
                ...prev,
                [setting]: !prev[setting]
            }));

            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.error('Failed to update setting:', error);
            Alert.alert('오류', '설정 변경에 실패했습니다.');
        }
    };

    // 그룹 나가기
    const handleLeaveGroup = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(
                `${API_URL}/api/groups/${groupId}/leave`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            navigation.navigate('ChatList');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to leave group:', error);
            Alert.alert('오류', '그룹 나가기에 실패했습니다.');
        }
    };
    // 렌더링 메서드들
    const renderMemberList = () => (
        <View style={styles.memberListContainer}>
            <FlatList
                data={members}
                renderItem={renderMemberItem}
                numColumns={3}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.memberGrid}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
            />
        </View>
    );

    const renderMemberItem = useCallback(({ item }) => {
        const isSelected = selectedMembers.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.memberItem,
                    isSelected && styles.selectedMemberItem
                ]}
                onPress={() => handleMemberSelect(item.id)}
                onLongPress={() => handleMemberLongPress(item)}
                delayLongPress={500}
            >
                <FastImage
                    style={styles.memberImage}
                    source={{
                        uri: item.profileImage,
                        priority: FastImage.priority.normal
                    }}
                    defaultSource={require('../../assets/images/icons/user.png')}
                />
                <Text style={styles.memberName} numberOfLines={1}>
                    {item.name}
                </Text>
                {item.role !== ROLES.MEMBER && (
                    <View style={styles.roleIndicator}>
                        <MaterialIcons
                            name={item.role === ROLES.ADMIN ? "star" : "shield"}
                            size={16}
                            color="#FFD700"
                        />
                    </View>
                )}
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
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedMembersList}
            >
                {selectedMembers.map(memberId => {
                    const member = members.find(m => m.id === memberId);
                    if (!member) return null;

                    return (
                        <View key={member.id} style={styles.selectedMemberItem}>
                            <FastImage
                                style={styles.selectedMemberImage}
                                source={{
                                    uri: member.profileImage,
                                    priority: FastImage.priority.high
                                }}
                                defaultSource={require('../../assets/images/icons/user.png')}
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
            <Text style={styles.emptyText}>멤버를 추가해주세요</Text>
        </View>
    );

    const renderMemberOptions = () => (
        <Modal
            isVisible={showMemberOptions}
            onBackdropPress={() => setShowMemberOptions(false)}
            style={styles.optionsModal}
        >
            <View style={styles.optionsContainer}>
                {userRole === ROLES.OWNER && (
                    <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => handleRoleChange(selectedMember.id, ROLES.ADMIN)}
                    >
                        <MaterialIcons name="star" size={24} color="#333333" />
                        <Text style={styles.optionText}>관리자로 지정</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleRemoveMember(selectedMember.id)}
                >
                    <MaterialIcons name="person-remove" size={24} color="#FF3B30" />
                    <Text style={[styles.optionText, { color: '#FF3B30' }]}>
                        멤버 내보내기
                    </Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* 상단 바 */}
            <View style={styles.header}>
                <TextInput
                    style={[
                        styles.groupNameInput,
                        !isNameValid && styles.invalidInput
                    ]}
                    placeholder="그룹 이름 입력"
                    placeholderTextColor="#757575"
                    value={groupName}
                    onChangeText={handleGroupNameChange}
                    maxLength={30}
                />
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleGroupIconSelect}
                >
                    {groupIcon ? (
                        <FastImage
                            style={styles.groupIcon}
                            source={{ uri: groupIcon }}
                            defaultSource={require('../../assets/images/icons/user.png')}
                        />
                    ) : (
                        <MaterialIcons name="add-photo-alternate" size={24} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* 멤버 목록 */}
            {renderMemberList()}

            {/* 선택된 멤버 미리보기 */}
            {selectedMembers.length > 0 && renderSelectedMembers()}

            {/* 그룹 생성 버튼 */}
            <TouchableOpacity
                style={[
                    styles.createButton,
                    (!groupName.trim() || selectedMembers.length < 2) &&
                    styles.createButtonDisabled
                ]}
                onPress={handleCreateGroup}
                disabled={!groupName.trim() || selectedMembers.length < 2}
            >
                <Text style={styles.createButtonText}>
                    그룹 생성 ({selectedMembers.length}명)
                </Text>
            </TouchableOpacity>

            {/* 멤버 옵션 모달 */}
            {renderMemberOptions()}
        </View>
    );
    // 참가자 목록 렌더링
    const renderParticipantsList = () => (
        <Animated.View
            style={[
                styles.participantsPanel,
                {
                    transform: [{
                        translateX: participantPanelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [PARTICIPANT_PANEL_WIDTH, 0]
                        })
                    }]
                }
            ]}
        >
            <View style={styles.participantsHeader}>
                <Text style={styles.participantsTitle}>
                    참가자 ({participants.length})
                </Text>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowParticipants(false)}
                >
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={participants}
                renderItem={renderParticipantItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
            />
        </Animated.View>
    );

    const renderParticipantItem = useCallback(({ item }) => (
        <View style={styles.participantItem}>
            <FastImage
                style={styles.participantThumbnail}
                source={{ uri: item.profileImage }}
                defaultSource={require('../assets/default-profile.png')}
            />
            <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{item.name}</Text>
                {item.isSpeaking && (
                    <View style={styles.speakingIndicator} />
                )}
            </View>
            {userRole === 'host' && item.id !== user.id && (
                <TouchableOpacity
                    style={styles.participantAction}
                    onPress={() => handleParticipantOptions(item)}
                >
                    <MaterialIcons name="more-vert" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
    ), [userRole, user.id]);

    // 통화 컨트롤 패널 렌더링
    const renderControlPanel = () => (
        <Animated.View
            style={[
                styles.controlPanel,
                {
                    opacity: controlPanelAnim,
                    transform: [{
                        translateY: controlPanelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0]
                        })
                    }]
                }
            ]}
        >
            <TouchableOpacity
                style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                onPress={handleMuteToggle}
            >
                <MaterialIcons
                    name={isMuted ? "mic-off" : "mic"}
                    size={24}
                    color="#FFFFFF"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
                onPress={handleVideoToggle}
            >
                <MaterialIcons
                    name={isVideoEnabled ? "videocam" : "videocam-off"}
                    size={24}
                    color="#FFFFFF"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
                onPress={handleSpeakerToggle}
            >
                <MaterialIcons
                    name={isSpeakerOn ? "volume-up" : "volume-off"}
                    size={24}
                    color="#FFFFFF"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.controlButton, isScreenSharing && styles.controlButtonActive]}
                onPress={handleScreenShare}
            >
                <MaterialIcons
                    name={isScreenSharing ? "screen-share" : "stop-screen-share"}
                    size={24}
                    color="#FFFFFF"
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.controlButton, styles.endCallButton]}
                onPress={handleEndCall}
            >
                <MaterialIcons name="call-end" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
    );

    // 네트워크 상태 표시
    const renderNetworkStatus = () => (
        <View style={styles.networkStatus}>
            <MaterialIcons
                name={getNetworkIcon(networkQuality)}
                size={24}
                color={getNetworkColor(networkQuality)}
            />
            {networkQuality < 30 && (
                <Text style={styles.networkWarning}>
                    네트워크 상태가 불안정합니다
                </Text>
            )}
        </View>
    );

    // 통화 시간 표시
    const renderCallDuration = () => (
        <Text style={styles.callDuration}>
            {formatDuration(callDuration)}
        </Text>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* 주 영상 영역 */}
            <View style={styles.mainVideoContainer}>
                <JitsiMeeting
                    ref={jitsiRef}
                    style={styles.mainVideo}
                />

                {/* 상단 정보 */}
                <View style={styles.headerInfo}>
                    {renderCallDuration()}
                    {renderNetworkStatus()}
                </View>

                {/* 컨트롤 패널 */}
                {renderControlPanel()}

                {/* 참가자 목록 */}
                {showParticipants && renderParticipantsList()}

                {/* 네트워크 경고 */}
                {networkQuality < 30 && (
                    <View style={styles.qualityWarning}>
                        <MaterialIcons name="warning" size={24} color="#FFFFFF" />
                        <Text style={styles.warningText}>
                            네트워크 상태가 불안정합니다. 비디오를 비활성화하는 것을 권장합니다.
                        </Text>
                    </View>
                )}

                {/* 재연결 중 오버레이 */}
                {networkQuality < 10 && (
                    <View style={styles.reconnectingOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.reconnectingText}>
                            재연결 중...
                        </Text>
                    </View>
                )}
            </View>
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
    memberListContainer: {
        flex: 1,
        padding: 16,
    },
    memberGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    memberItem: {
        width: (SCREEN_WIDTH - 64) / 3,
        aspectRatio: 1,
        marginBottom: 16,
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
    selectedMemberItem: {
        backgroundColor: '#E8F5E9',
    },
    memberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 8,
    },
    memberName: {
        fontSize: 14,
        fontFamily: 'Roboto-Medium',
        color: '#212121',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    roleIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderRadius: 12,
        padding: 4,
    },
    checkmarkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedMembersContainer: {
        height: 70,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingVertical: 8,
    },
    selectedMembersList: {
        paddingHorizontal: 8,
    },
    selectedMemberImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginHorizontal: 4,
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
        bottom: Platform.OS === 'ios' ? 34 : 16,
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
    optionsModal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    optionsContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        color: '#333333',
        marginLeft: 16,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
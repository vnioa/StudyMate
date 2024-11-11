// VideoCallScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    PanResponder,
    Alert,
    AppState
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { JitsiMeeting } from 'react-native-jitsi-meet';
import { BlurView } from '@react-native-community/blur';
import * as Haptics from 'expo-haptics';
import * as ScreenCapture from 'expo-screen-capture';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { API_URL } from '../config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTROL_PANEL_HEIGHT = 80;
const PARTICIPANT_PANEL_WIDTH = SCREEN_WIDTH * 0.3;

const VideoCallScreen = () => {
    // 상태 관리
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showParticipants, setShowParticipants] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(100);
    const [callDuration, setCallDuration] = useState(0);
    const [dominantSpeaker, setDominantSpeaker] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);

    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const currentCall = useSelector(state => state.call.currentCall);

    // Refs
    const jitsiRef = useRef(null);
    const controlPanelAnim = useRef(new Animated.Value(1)).current;
    const participantPanelAnim = useRef(new Animated.Value(0)).current;
    const durationTimerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const networkCheckIntervalRef = useRef(null);
    const lastTapRef = useRef(0);

    // Navigation
    const navigation = useNavigation();
    const route = useRoute();
    const { callId, isVideoCall } = route.params;

    // 초기화
    useEffect(() => {
        initializeCall();
        return () => cleanupCall();
    }, []);

    const initializeCall = async () => {
        try {
            await setupJitsiMeeting();
            initializeScreenCapture();
            setupNetworkMonitoring();
            startDurationTimer();
            setupAppStateListener();
        } catch (error) {
            console.error('Call initialization failed:', error);
            Alert.alert('오류', '통화 연결에 실패했습니다.');
            handleEndCall();
        }
    };

    const cleanupCall = () => {
        clearInterval(durationTimerRef.current);
        clearInterval(networkCheckIntervalRef.current);
        clearTimeout(controlsTimeoutRef.current);
        jitsiRef.current?.dispose();
    };

    // Jitsi 설정
    const setupJitsiMeeting = async () => {
        const options = {
            room: `studymate-${callId}`,
            userInfo: {
                displayName: user.name,
                email: user.email,
                avatar: user.profileImage
            },
            audioMuted: false,
            videoMuted: !isVideoCall,
            subject: 'StudyMate Video Call',
            token: await AsyncStorage.getItem('userToken')
        };

        const meetingOptions = {
            ...options,
            onConferenceJoined: handleConferenceJoined,
            onConferenceLeft: handleConferenceLeft,
            onParticipantJoined: handleParticipantJoined,
            onParticipantLeft: handleParticipantLeft,
            onDominantSpeakerChanged: handleDominantSpeakerChanged,
            onNetworkQualityChanged: handleNetworkQualityChanged
        };

        jitsiRef.current = new JitsiMeeting(meetingOptions);
    };

    // 이벤트 핸들러
    const handleConferenceJoined = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showConnectedAnimation();
    }, []);

    const handleConferenceLeft = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleParticipantJoined = useCallback((participant) => {
        setParticipants(prev => [...prev, participant]);
        showParticipantJoinAnimation(participant);
    }, []);

    const handleParticipantLeft = useCallback((participant) => {
        setParticipants(prev => prev.filter(p => p.id !== participant.id));
        showParticipantLeaveAnimation(participant);
    }, []);

    const handleDominantSpeakerChanged = useCallback((participant) => {
        setDominantSpeaker(participant);
        highlightDominantSpeaker(participant);
    }, []);
    // 컨트롤 패널 관련 함수들
    const handleMuteToggle = useCallback(() => {
        try {
            jitsiRef.current?.executeCommand('toggleAudio');
            setIsMuted(prev => !prev);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.error('Failed to toggle audio:', error);
            Alert.alert('오류', '음소거 설정에 실패했습니다.');
        }
    }, []);

    const handleVideoToggle = useCallback(() => {
        try {
            jitsiRef.current?.executeCommand('toggleVideo');
            setIsVideoEnabled(prev => !prev);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.error('Failed to toggle video:', error);
            Alert.alert('오류', '비디오 설정에 실패했습니다.');
        }
    }, []);

    const handleSpeakerToggle = useCallback(() => {
        try {
            jitsiRef.current?.executeCommand('toggleAudioOutput');
            setIsSpeakerOn(prev => !prev);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.error('Failed to toggle speaker:', error);
            Alert.alert('오류', '스피커 설정에 실패했습니다.');
        }
    }, []);

    const handleScreenShare = useCallback(async () => {
        try {
            if (!isScreenSharing) {
                await ScreenCapture.requestPermissionsAsync();
                jitsiRef.current?.executeCommand('toggleShareScreen');
            } else {
                jitsiRef.current?.executeCommand('toggleShareScreen');
            }
            setIsScreenSharing(prev => !prev);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.error('Failed to toggle screen share:', error);
            Alert.alert('오류', '화면 공유에 실패했습니다.');
        }
    }, [isScreenSharing]);

    const handleEndCall = useCallback(() => {
        Alert.alert(
            '통화 종료',
            '통화를 종료하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '종료',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await jitsiRef.current?.endCall();
                            navigation.goBack();
                        } catch (error) {
                            console.error('Failed to end call:', error);
                            navigation.goBack();
                        }
                    }
                }
            ]
        );
    }, [navigation]);

    // 참가자 관리 함수들
    const handleParticipantKick = useCallback(async (participantId) => {
        try {
            await jitsiRef.current?.executeCommand('kickParticipant', participantId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Failed to kick participant:', error);
            Alert.alert('오류', '참가자 제거에 실패했습니다.');
        }
    }, []);

    const handleParticipantMute = useCallback(async (participantId) => {
        try {
            await jitsiRef.current?.executeCommand('muteParticipant', participantId);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.error('Failed to mute participant:', error);
            Alert.alert('오류', '참가자 음소거에 실패했습니다.');
        }
    }, []);

    // 화면 제스처 핸들러
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setShowControls(true);
                clearTimeout(controlsTimeoutRef.current);
            },
            onPanResponderRelease: () => {
                controlsTimeoutRef.current = setTimeout(() => {
                    setShowControls(false);
                }, 3000);
            },
        })
    ).current;

    // 더블 탭 핸들러
    const handleDoubleTap = useCallback(() => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTapRef.current && (now - lastTapRef.current) < DOUBLE_TAP_DELAY) {
            setIsFullScreen(prev => !prev);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
        }
    }, []);

    // 네트워크 상태 모니터링
    const handleNetworkQualityChanged = useCallback((quality) => {
        setNetworkQuality(quality);

        if (quality < 30) {
            Alert.alert(
                '네트워크 상태 알림',
                '네트워크 상태가 불안정합니다. 비디오를 비활성화하시겠습니까?',
                [
                    {
                        text: '아니오',
                        style: 'cancel'
                    },
                    {
                        text: '예',
                        onPress: () => {
                            handleVideoToggle();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        }
                    }
                ]
            );
        }
    }, [handleVideoToggle]);

    // 통화 시간 타이머
    const startDurationTimer = useCallback(() => {
        durationTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    }, []);

    const formatDuration = useCallback((duration) => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;

        return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    // 렌더링 메서드들
    const renderControls = () => (
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <MaterialIcons name="call-end" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
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
            <FlatList
                data={participants}
                renderItem={renderParticipantItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
            />
        </Animated.View>
    );

    const renderParticipantItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.participantItem}
            onLongPress={() => handleParticipantLongPress(item)}
            delayLongPress={500}
        >
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
            {item.isMuted && (
                <MaterialIcons name="mic-off" size={20} color="#FF3B30" />
            )}
        </TouchableOpacity>
    ), []);

    // 스타일 정의
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#000000',
        },
        mainVideoContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        gradientBackground: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#1A1A1A',
        },
        headerInfo: {
            position: 'absolute',
            top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
        },
        callInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
        },
        callDuration: {
            color: '#FFFFFF',
            fontSize: 16,
            fontFamily: 'SFProText-Regular',
            marginRight: 8,
        },
        networkStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 8,
        },
        networkIcon: {
            width: 24,
            height: 24,
        },
        controlPanel: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        },
        controlButton: {
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
        },
        controlButtonActive: {
            backgroundColor: 'rgba(255, 59, 48, 0.8)',
        },
        endCallButton: {
            backgroundColor: '#FF3B30',
        },
        participantsPanel: {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: PARTICIPANT_PANEL_WIDTH,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
        participantItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        },
        participantThumbnail: {
            width: 120,
            height: 90,
            borderRadius: 8,
        },
        participantInfo: {
            flex: 1,
            marginLeft: 12,
        },
        participantName: {
            color: '#FFFFFF',
            fontSize: 14,
            fontFamily: 'SFProText-Medium',
        },
        speakingIndicator: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#4CAF50',
            marginTop: 4,
        },
        optionsMenu: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 12,
            padding: 8,
        },
        optionItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
        },
        optionText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontFamily: 'SFProText-Regular',
            marginLeft: 12,
        },
        qualityWarning: {
            position: 'absolute',
            top: 100,
            left: 16,
            right: 16,
            backgroundColor: 'rgba(255, 59, 48, 0.9)',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
        },
        warningText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontFamily: 'SFProText-Regular',
            flex: 1,
            marginLeft: 8,
        },
        fullScreenVideo: {
            ...StyleSheet.absoluteFillObject,
        },
        reconnectingOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        reconnectingText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontFamily: 'SFProText-Medium',
            marginTop: 16,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Animated.View style={styles.gradientBackground} />

            <View style={styles.mainVideoContainer}>
                {/* Jitsi Meeting Component */}
                <JitsiMeeting
                    ref={jitsiRef}
                    style={styles.fullScreenVideo}
                />
            </View>

            {/* Header Info */}
            <View style={styles.headerInfo}>
                <View style={styles.callInfo}>
                    <Text style={styles.callDuration}>
                        {formatDuration(callDuration)}
                    </Text>
                    <View style={styles.networkStatus}>
                        <MaterialIcons
                            name={getNetworkIcon(networkQuality)}
                            size={24}
                            color={getNetworkColor(networkQuality)}
                        />
                    </View>
                </View>
            </View>

            {/* Control Panel */}
            {showControls && renderControls()}

            {/* Participants Panel */}
            {showParticipants && renderParticipantsList()}

            {/* Network Quality Warning */}
            {networkQuality < 30 && (
                <View style={styles.qualityWarning}>
                    <MaterialIcons name="warning" size={24} color="#FFFFFF" />
                    <Text style={styles.warningText}>
                        네트워크 상태가 불안정합니다. 비디오를 비활성화하는 것을 권장합니다.
                    </Text>
                </View>
            )}

            {/* Reconnecting Overlay */}
            {networkQuality < 10 && (
                <View style={styles.reconnectingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.reconnectingText}>
                        재연결 중...
                    </Text>
                </View>
            )}
        </View>
    );
};

export default VideoCallScreen;
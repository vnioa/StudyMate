// src/screens/chat/VideoCallScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
    Alert,
    BackHandler,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../../utils/styles';
import socket from '../../services/socket';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { roomId } = route.params;

    // WebRTC 상태
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isConnecting, setIsConnecting] = useState(true);
    const [networkQuality, setNetworkQuality] = useState('good'); // good, fair, poor
    const [participants, setParticipants] = useState([]);

    // WebRTC 참조
    const peerConnection = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // WebRTC 설정
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            {
                urls: 'turn:your-turn-server.com',
                username: 'username',
                credential: 'credential'
            }
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        sdpSemantics: 'unified-plan'
    };

    // 초기 설정
    useEffect(() => {
        setupWebRTC();
        setupSocketListeners();
        setupBackHandler();
        monitorNetworkQuality();

        return () => {
            cleanupWebRTC();
            cleanupSocketListeners();
        };
    }, []);

    // 네트워크 품질 모니터링
    const monitorNetworkQuality = () => {
        if (peerConnection.current) {
            setInterval(() => {
                peerConnection.current.getStats().then(stats => {
                    stats.forEach(report => {
                        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                            const rtt = report.currentRoundTripTime;
                            if (rtt < 0.1) setNetworkQuality('good');
                            else if (rtt < 0.3) setNetworkQuality('fair');
                            else setNetworkQuality('poor');
                        }
                    });
                });
            }, 2000);
        }
    };

    // WebRTC 초기화
    const setupWebRTC = async () => {
        try {
            // 미디어 스트림 설정
            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setLocalStream(stream);

            // Peer Connection 설정
            peerConnection.current = new RTCPeerConnection(configuration);

            // 스트림 추가
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });

            // 원격 스트림 처리
            peerConnection.current.ontrack = event => {
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                }
            };

            // ICE 후보 처리
            peerConnection.current.onicecandidate = event => {
                if (event.candidate) {
                    socket.emit('call:candidate', {
                        roomId,
                        candidate: event.candidate
                    });
                }
            };

            // 연결 상태 변경 처리
            peerConnection.current.onconnectionstatechange = () => {
                switch(peerConnection.current.connectionState) {
                    case 'connected':
                        setIsConnecting(false);
                        break;
                    case 'disconnected':
                        handleConnectionError('연결이 끊어졌습니다.');
                        break;
                    case 'failed':
                        handleConnectionError('연결에 실패했습니다.');
                        break;
                }
            };

            setIsConnecting(false);
        } catch (error) {
            handleError('카메라와 마이크 접근 권한이 필요합니다.');
        }
    };

    // 소켓 리스너 설정
    const setupSocketListeners = () => {
        socket.emit('call:join', { roomId });

        socket.on('call:offer', handleOffer);
        socket.on('call:answer', handleAnswer);
        socket.on('call:candidate', handleCandidate);
        socket.on('call:participantJoined', handleParticipantJoined);
        socket.on('call:participantLeft', handleParticipantLeft);
        socket.on('call:error', handleError);
    };

    // 뒤로가기 처리
    const setupBackHandler = () => {
        const backAction = () => {
            Alert.alert(
                '통화 종료',
                '통화를 종료하시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '종료',
                        style: 'destructive',
                        onPress: handleEndCall
                    }
                ]
            );
            return true;
        };

        BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => BackHandler.removeEventListener('hardwareBackPress', backAction);
    };

    // WebRTC 시그널링 핸들러
    const handleOffer = async (offer) => {
        try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.emit('call:answer', {
                roomId,
                answer
            });
        } catch (error) {
            handleError('오퍼 처리 중 오류가 발생했습니다.');
        }
    };

    const handleAnswer = async (answer) => {
        try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            handleError('응답 처리 중 오류가 발생했습니다.');
        }
    };

    const handleCandidate = async (candidate) => {
        try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            handleError('ICE 후보 처리 중 오류가 발생했습니다.');
        }
    };

    // 참가자 관리
    const handleParticipantJoined = (participant) => {
        setParticipants(prev => [...prev, participant]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleParticipantLeft = (participantId) => {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };

    // 에러 처리
    const handleError = (message) => {
        Alert.alert('오류', message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const handleConnectionError = (message) => {
        Alert.alert('연결 오류', message, [
            { text: '재연결', onPress: setupWebRTC },
            { text: '종료', onPress: handleEndCall }
        ]);
    };

    // 정리 함수
    const cleanupWebRTC = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
        }
    };

    const cleanupSocketListeners = () => {
        socket.off('call:offer');
        socket.off('call:answer');
        socket.off('call:candidate');
        socket.off('call:participantJoined');
        socket.off('call:participantLeft');
        socket.off('call:error');
    };

    // 컨트롤 핸들러
    const handleToggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleToggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(!isCameraOff);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleToggleSpeaker = () => {
        // RTCPeerConnection API를 통한 스피커 전환
        if (peerConnection.current) {
            const audioTrack = remoteStream?.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !isSpeakerOn;
            }
        }
        setIsSpeakerOn(!isSpeakerOn);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleSwitchCamera = async () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            await videoTrack._switchCamera();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleEndCall = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        socket.emit('call:leave', { roomId });
        cleanupWebRTC();
        navigation.goBack();
    };

    // 화면 공유
    const handleScreenShare = async () => {
        try {
            const screenStream = await mediaDevices.getDisplayMedia();
            const screenTrack = screenStream.getVideoTracks()[0];

            const sender = peerConnection.current.getSenders().find(s =>
                s.track.kind === 'video'
            );

            await sender.replaceTrack(screenTrack);

            screenTrack.onended = () => {
                const videoTrack = localStream.getVideoTracks()[0];
                sender.replaceTrack(videoTrack);
            };
        } catch (error) {
            handleError('화면 공유를 시작할 수 없습니다.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* 네트워크 품질 표시 */}
            {networkQuality !== 'good' && (
                <View style={[
                    styles.networkBanner,
                    networkQuality === 'poor' && styles.networkBannerPoor
                ]}>
                    <Text style={styles.networkText}>
                        {networkQuality === 'fair' ? '네트워크 상태가 불안정합니다' : '네트워크 상태가 좋지 않습니다'}
                    </Text>
                </View>
            )}

            {/* 원격 비디오 */}
            <View style={styles.remoteVideo}>
                {remoteStream ? (
                    <RTCView
                        ref={remoteVideoRef}
                        streamURL={remoteStream.toURL()}
                        style={styles.videoStream}
                        objectFit="cover"
                    />
                ) : (
                    <View style={styles.waitingContainer}>
                        <ActivityIndicator size="large" color="white" />
                        <Text style={styles.waitingText}>
                            {isConnecting ? '연결 중...' : '상대방을 기다리는 중...'}
                        </Text>
                    </View>
                )}
            </View>

            {/* 로컬 비디오 */}
            <View style={styles.localVideo}>
                <RTCView
                    ref={localVideoRef}
                    streamURL={localStream?.toURL()}
                    style={styles.videoStream}
                    objectFit="cover"
                    mirror
                />
                {isCameraOff && (
                    <View style={styles.cameraCover}>
                        <Ionicons name="videocam-off" size={32} color="white" />
                    </View>
                )}
            </View>

            {/* 참가자 목록 */}
            <View style={styles.participantsList}>
                {participants.map(participant => (
                    <View key={participant.id} style={styles.participantItem}>
                        <Text style={styles.participantName}>{participant.name}</Text>
                    </View>
                ))}
            </View>

            {/* 통화 컨트롤 */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                    onPress={handleToggleMute}
                >
                    <Ionicons
                        name={isMuted ? "mic-off" : "mic"}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
                    onPress={handleToggleCamera}
                >
                    <Ionicons
                        name={isCameraOff ? "videocam-off" : "videocam"}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.endCallButton]}
                    onPress={handleEndCall}
                >
                    <Ionicons name="call" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleSwitchCamera}
                >
                    <Ionicons name="camera-reverse" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
                    onPress={handleToggleSpeaker}
                >
                    <Ionicons
                        name={isSpeakerOn ? "volume-high" : "volume-mute"}
                        size={24}
                        color="white"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleScreenShare}
                >
                    <Ionicons name="share-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    networkBanner: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.status.warning + '80',
        padding: theme.spacing.sm,
        zIndex: 1000,
    },
    networkBannerPoor: {
        backgroundColor: theme.colors.status.error + '80',
    },
    networkText: {
        color: 'white',
        textAlign: 'center',
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
    },
    remoteVideo: {
        flex: 1,
    },
    localVideo: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        width: width * 0.25,
        height: (width * 0.25) * 1.5,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
    },
    videoStream: {
        flex: 1,
    },
    cameraCover: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    waitingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    waitingText: {
        color: 'white',
        marginTop: theme.spacing.md,
        fontSize: theme.typography.size.body1,
        fontFamily: theme.typography.fontFamily.medium,
    },
    participantsList: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        left: 20,
    },
    participantItem: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: theme.spacing.sm,
        borderRadius: theme.layout.components.borderRadius,
        marginBottom: theme.spacing.xs,
    },
    participantName: {
        color: 'white',
        fontSize: theme.typography.size.caption,
        fontFamily: theme.typography.fontFamily.medium,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: theme.spacing.sm,
    },
    controlButtonActive: {
        backgroundColor: theme.colors.primary.main,
    },
    endCallButton: {
        backgroundColor: theme.colors.status.error,
        transform: [{ rotate: '135deg' }],
    }
});
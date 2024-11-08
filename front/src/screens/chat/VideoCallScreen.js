import React, { useEffect } from 'react';
import {
    StyleSheet,
    BackHandler,
    Alert,
    Platform,
    SafeAreaView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function VideoCallScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { roomId } = route.params;

    // Jitsi Meet 설정
    const domain = 'meet.jit.si';
    const roomName = `studymate_${roomId}`;
    const url = `https://${domain}/${roomName}#config.prejoinPageEnabled=false`;

    // 뒤로가기 처리
    useEffect(() => {
        const backAction = async () => {
            try {
                Alert.alert(
                    '통화 종료',
                    '화상 통화를 종료하시겠습니까?',
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
                                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                    navigation.goBack();
                                } catch (error) {
                                    console.warn('Haptic feedback failed:', error);
                                }
                            }
                        }
                    ]
                );
            } catch (error) {
                console.warn('Error handling back press:', error);
            }
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [navigation]);

    // JavaScript 인터페이스
    const injectedJavaScript = `
        window.onload = () => {
            const domain = '${domain}';
            const options = {
                roomName: '${roomName}',
                width: '100%',
                height: '100%',
                parentNode: document.body,
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone',
                        'camera',
                        'closedcaptions',
                        'desktop',
                        'fullscreen',
                        'fodeviceselection',
                        'hangup',
                        'profile',
                        'chat',
                        'recording',
                        'livestreaming',
                        'etherpad',
                        'sharedvideo',
                        'settings',
                        'raisehand',
                        'videoquality',
                        'filmstrip',
                        'feedback',
                        'stats',
                        'shortcuts',
                        'tileview',
                        'select-background',
                        'download',
                        'help',
                        'mute-everyone',
                        'security'
                    ],
                    SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    BRAND_WATERMARK_LINK: '',
                    SHOW_POWERED_BY: false,
                    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                    MOBILE_APP_PROMO: false,
                    DEFAULT_BACKGROUND: '#1C1C1C',
                    DEFAULT_LOCAL_DISPLAY_NAME: 'Me',
                    DEFAULT_REMOTE_DISPLAY_NAME: 'User',
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    DISABLE_VIDEO_BACKGROUND: false,
                    ENABLE_DIAL_OUT: false,
                    HIDE_INVITE_MORE_HEADER: true
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    enableWelcomePage: false,
                    enableClosePage: false,
                    disableDeepLinking: true,
                    defaultLanguage: 'ko',
                    enableNoisyMicDetection: true,
                    enableNoAudioDetection: true,
                    enableLipSync: true,
                    disableInviteFunctions: true,
                    prejoinPageEnabled: false,
                    readOnlyName: true
                }
            };
            const api = new JitsiMeetExternalAPI(domain, options);
            
            api.addEventListener('videoConferenceLeft', () => {
                window.ReactNativeWebView.postMessage('hangup');
            });

            api.addEventListener('readyToClose', () => {
                window.ReactNativeWebView.postMessage('hangup');
            });

            api.addEventListener('participantLeft', () => {
                window.ReactNativeWebView.postMessage('participantLeft');
            });
        };
        true;
    `;

    const handleMessage = async (event) => {
        try {
            const { data } = event.nativeEvent;

            if (data === 'hangup' || data === 'participantLeft') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                navigation.goBack();
            }
        } catch (error) {
            console.warn('Error handling message:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                source={{ uri: url }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                injectedJavaScript={injectedJavaScript}
                onMessage={handleMessage}
                onError={() => {
                    Alert.alert(
                        '오류',
                        '화상 통화 연결에 실패했습니다.',
                        [
                            {
                                text: '확인',
                                onPress: () => navigation.goBack()
                            }
                        ]
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1C',
    },
    webview: {
        flex: 1,
        backgroundColor: '#1C1C1C',
    }
});
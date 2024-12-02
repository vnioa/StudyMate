import React, { useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NAVER_CLIENT_ID, NAVER_REDIRECT_URI, BACKEND_BASE_URL } from '@env';

const runFirst = `window.ReactNativeWebView.postMessage("this is message from web");`;

const NaverLoginScreen = ({ navigation }) => {
    const [webViewKey, setWebViewKey] = useState(0); // 웹뷰 키를 상태로 관리

    const LogInProgress = (data) => {
        const exp = "code=";
        const condition = data.indexOf(exp);
        if (condition !== -1) {
            const request_code = data.substring(condition + exp.length);
            sendCodeToBackend(request_code); // 인증 코드를 백엔드로 전송
        }
    };

    const sendCodeToBackend = (code) => {
        console.log('Authorization code being sent to backend:', code);
        fetch(`${BACKEND_BASE_URL}/auth/naver-login?code=${code}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then((data) => {
                console.log('Response from backend:', data); // 백엔드 응답 출력
            })
            .catch((error) => {
                console.error('Error connecting to backend:', error); // 오류 처리
            });
    };

    return (
        <View style={{ flex: 1 }}>
            <WebView
                key={webViewKey} // 새로고침할 때마다 key를 바꿔서 새로 로드
                originWhitelist={['*']}
                scalesPageToFit={false}
                style={{ marginTop: 30 }}
                source={{
                    uri: `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_REDIRECT_URI}`,
                }}
                injectedJavaScript={runFirst}
                javaScriptEnabled={true}
                onMessage={(event) => {
                    LogInProgress(event.nativeEvent.url);
                }} // 인증 코드 처리
            />
        </View>
    );
};

export default NaverLoginScreen;

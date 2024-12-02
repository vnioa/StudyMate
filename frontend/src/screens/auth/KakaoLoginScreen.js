import React from 'react';
import { View } from "react-native";
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI ,BACKEND_BASE_URL} from 'react-native-dotenv';

const runFirst = `window.ReactNativeWebView.postMessage("this is message from web");`;

const KakaoLoginScreen = ({ navigation }) => {

    function LogInProgress(data) {
        const exp = "code=";
        var condition = data.indexOf(exp);
        if (condition !== -1) {
            var request_code = data.substring(condition + exp.length);
            sendCodeToBackend(request_code); // 인증 코드를 백엔드로 전송
        }
    }

    const sendCodeToBackend = (code) => {
        console.log('Authorization code being sent to backend:', code);
        fetch(`${BACKEND_BASE_URL}/auth/kakao-login?code=` + code)
        .then(response => {
            // 응답 상태 코드가 200번대인지 확인
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // JSON 파싱
        })
        .then(data => {
            console.log('Response from backend:', data); // 백엔드 응답 출력
        })
        .catch(error => {
            console.error('Error connecting to backend:', error); // 오류 처리
        });
    };

    const requestToken = async (request_code) => {
        var request_token_url = "https://kauth.kakao.com/oauth/token";

        axios({
            method: "post",
            url: request_token_url,
            params: {
                grant_type: 'authorization_code',
                client_id: KAKAO_CLIENT_ID, // 환경변수에서 클라이언트 ID 가져오기
                redirect_uri: KAKAO_REDIRECT_URI, // 환경변수에서 리다이렉트 URI 가져오기
                code: request_code,
            },
        }).then(function (response) {
            axios({
                method: 'get',
                url: 'https://kapi.kakao.com/v2/user/me',
                headers: {
                    Authorization: `Bearer ${response.data.access_token}`
                }
            }).then(function (response) {
                console.log('response :: ' + JSON.stringify(response));
            }).catch(function (error) {
                console.log('error', error);
            });

        }).catch(function (error) {
            console.log('error', error);
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <WebView
                originWhitelist={['*']}
                scalesPageToFit={false}
                style={{ marginTop: 30 }}
                source={{
                    uri: `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}`
                }}
                injectedJavaScript={runFirst}
                javaScriptEnabled={true}
                onMessage={(event) => { LogInProgress(event.nativeEvent["url"]); }} // 인증 코드 처리
            />
        </View>
    );
};

export default KakaoLoginScreen;

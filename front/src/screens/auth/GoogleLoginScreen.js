import React, { useEffect } from 'react';
import { Button, StyleSheet, View, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '@env'; // 환경변수 가져오기

WebBrowser.maybeCompleteAuthSession();

const GoogleLoginScreen = ({ navigation }) => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID, // 환경변수 사용
        iosClientId: GOOGLE_IOS_CLIENT_ID, // iOS 클라이언트 ID
        androidClientId: GOOGLE_ANDROID_CLIENT_ID, // Android 클라이언트 ID
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            console.log('Authentication successful:', authentication);
        }
    }, [response]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Google Login with Expo</Text>
            <Button
                disabled={!request}
                title="Login with Google"
                onPress={() => promptAsync()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        marginBottom: 20,
    },
});

export default GoogleLoginScreen;
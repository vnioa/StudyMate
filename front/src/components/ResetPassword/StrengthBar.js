import React from 'react';
import { View, Animated, Text } from 'react-native';
import styles from '../../styles/ResetPasswordStyles';

const StrengthBar = ({ strength, strengthBarWidth }) => (
    <>
        <View style={styles.strengthBarBackground}>
            <Animated.View
                style={[
                    styles.strengthBar,
                    {
                        backgroundColor:
                            strength === '강함' ? 'green' : strength === '중간' ? 'orange' : 'red',
                        width: strengthBarWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                    },
                ]}
            />
        </View>
        <Text style={styles.passwordStrength}>비밀번호 강도: {strength}</Text>
    </>
);

export default StrengthBar;
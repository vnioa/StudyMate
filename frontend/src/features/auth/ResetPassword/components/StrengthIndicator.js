import React from 'react';
import { View, Text, Animated } from 'react-native';
import styles from '../styles';

const StrengthIndicator = ({ strength, barWidth }) => {
    return (
        <View>
            <View style={styles.strengthBarBackground}>
                <Animated.View
                    style={[
                        styles.strengthBar,
                        {
                            backgroundColor:
                                strength === '강함' ? '#4CAF50' :
                                    strength === '중간' ? '#FFA000' :
                                        '#F44336',
                            width: barWidth.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
            <Text style={styles.strengthText}>
                비밀번호 강도: {strength}
            </Text>
        </View>
    );
};

export default React.memo(StrengthIndicator);
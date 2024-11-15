// components/common/CircularProgress/index.js
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import PropTypes from 'prop-types';
import styles from './styles';

const CircularProgress = ({
                              size = 120,
                              strokeWidth = 12,
                              percentage = 0,
                              color = '#007AFF',
                              bgColor = '#E5E5EA',
                              showPercentage = true,
                              duration = 1000,
                              label,
                              style,
                              textStyle,
                              animated = true,
                              onAnimationComplete
                          }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const circleRef = useRef();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    // SVG 중심점 계산
    const center = size / 2;

    useEffect(() => {
        if (animated) {
            Animated.timing(animatedValue, {
                toValue: percentage,
                duration,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }).start(() => {
                onAnimationComplete?.();
            });
        } else {
            animatedValue.setValue(percentage);
        }
    }, [percentage, animated, duration]);

    // 진행도에 따른 stroke-dashoffset 계산
    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: [circumference, 0]
    });

    // 애니메이션 값을 텍스트로 표시
    const progressText = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0', '100']
    });

    return (
        <View style={[styles.container, style]}>
            <Svg width={size} height={size} style={styles.svg}>
                {/* 배경 원 */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* 진행도 원 */}
                <G rotation="-90" origin={`${center}, ${center}`}>
                    <AnimatedCircle
                        ref={circleRef}
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                    />
                </G>
            </Svg>

            {/* 중앙 텍스트 */}
            {showPercentage && (
                <View style={styles.textContainer}>
                    <Animated.Text style={[styles.percentageText, textStyle]}>
                        {progressText}%
                    </Animated.Text>
                    {label && <Text style={styles.label}>{label}</Text>}
                </View>
            )}
        </View>
    );
};

// AnimatedCircle 컴포넌트
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

CircularProgress.propTypes = {
    size: PropTypes.number,
    strokeWidth: PropTypes.number,
    percentage: PropTypes.number,
    color: PropTypes.string,
    bgColor: PropTypes.string,
    showPercentage: PropTypes.bool,
    duration: PropTypes.number,
    label: PropTypes.string,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    animated: PropTypes.bool,
    onAnimationComplete: PropTypes.func
};

export default React.memo(CircularProgress);
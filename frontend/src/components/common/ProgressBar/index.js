// components/common/ProgressBar/index.js
import React from 'react';
import { View, Animated } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

const ProgressBar = ({
                         progress = 0,
                         height = 8,
                         backgroundColor = '#E5E5EA',
                         progressColor = '#007AFF',
                         borderRadius = 4,
                         animated = true,
                         duration = 500,
                         style,
                         showAnimation = true,
                         onAnimationComplete
                     }) => {
    // 애니메이션 값 초기화
    const [animatedValue] = React.useState(new Animated.Value(0));
    const [width, setWidth] = React.useState(0);

    // progress 값이 변경될 때마다 애니메이션 실행
    React.useEffect(() => {
        if (animated && showAnimation) {
            Animated.timing(animatedValue, {
                toValue: progress,
                duration: duration,
                useNativeDriver: false
            }).start(() => {
                onAnimationComplete?.();
            });
        } else {
            animatedValue.setValue(progress);
        }
    }, [progress, animated, duration]);

    // 컨테이너의 너비를 측정
    const onLayout = (event) => {
        const { width: layoutWidth } = event.nativeEvent.layout;
        setWidth(layoutWidth);
    };

    // 진행률에 따른 너비 계산
    const progressWidth = animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp'
    });

    // 커스텀 스타일 적용
    const containerStyle = [
        styles.container,
        {
            height,
            backgroundColor,
            borderRadius
        },
        style
    ];

    const progressStyle = [
        styles.progress,
        {
            backgroundColor: progressColor,
            borderRadius,
            width: progressWidth
        }
    ];

    return (
        <View style={containerStyle} onLayout={onLayout}>
            <Animated.View style={progressStyle} />
        </View>
    );
};

ProgressBar.propTypes = {
    progress: PropTypes.number,
    height: PropTypes.number,
    backgroundColor: PropTypes.string,
    progressColor: PropTypes.string,
    borderRadius: PropTypes.number,
    animated: PropTypes.bool,
    duration: PropTypes.number,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    showAnimation: PropTypes.bool,
    onAnimationComplete: PropTypes.func
};

export default React.memo(ProgressBar);
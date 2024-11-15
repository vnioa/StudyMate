// components/common/Button/index.js
import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    View
} from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

const Button = ({
                    title,
                    onPress,
                    type = 'primary',
                    size = 'medium',
                    disabled = false,
                    loading = false,
                    icon,
                    iconPosition = 'left',
                    style,
                    textStyle,
                    loadingColor,
                    testID
                }) => {
    // 버튼 스타일 결정
    const buttonStyles = [
        styles.button,
        styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
        styles[`button${type.charAt(0).toUpperCase() + type.slice(1)}`],
        disabled && styles.buttonDisabled,
        style
    ];

    // 텍스트 스타일 결정
    const textStyles = [
        styles.text,
        styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
        styles[`text${type.charAt(0).toUpperCase() + type.slice(1)}`],
        disabled && styles.textDisabled,
        textStyle
    ];

    // 로딩 색상 결정
    const spinnerColor = loadingColor || (type === 'primary' ? '#FFFFFF' : '#007AFF');

    // 버튼 내용 렌더링
    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator color={spinnerColor} size={size === 'small' ? 'small' : 'small'} />;
        }

        const content = [
            icon && iconPosition === 'left' && (
                <View key="leftIcon" style={styles.iconLeft}>
                    {icon}
                </View>
            ),
            <Text key="text" style={textStyles}>
                {title}
            </Text>,
            icon && iconPosition === 'right' && (
                <View key="rightIcon" style={styles.iconRight}>
                    {icon}
                </View>
            )
        ];

        return content;
    };

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            testID={testID}
        >
            <View style={styles.contentContainer}>
                {renderContent()}
            </View>
        </TouchableOpacity>
    );
};

Button.propTypes = {
    title: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired,
    type: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    icon: PropTypes.element,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    loadingColor: PropTypes.string,
    testID: PropTypes.string
};

export default React.memo(Button);


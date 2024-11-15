// components/common/ErrorView/index.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import styles from './styles';

const ErrorView = ({
                       message = '오류가 발생했습니다.',
                       onRetry,
                       icon = 'alert-circle',
                       iconSize = 48,
                       iconColor = '#DC2626',
                       retryButtonText = '다시 시도',
                       showRetryButton = true,
                       style,
                       testID
                   }) => {
    return (
        <View style={[styles.container, style]} testID={testID}>
            <Icon
                name={icon}
                size={iconSize}
                color={iconColor}
                style={styles.icon}
            />
            <Text style={styles.message}>
                {message}
            </Text>
            {showRetryButton && onRetry && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                    activeOpacity={0.7}
                    testID={`${testID}-retry-button`}
                >
                    <Text style={styles.retryButtonText}>
                        {retryButtonText}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

ErrorView.propTypes = {
    message: PropTypes.string,
    onRetry: PropTypes.func,
    icon: PropTypes.string,
    iconSize: PropTypes.number,
    iconColor: PropTypes.string,
    retryButtonText: PropTypes.string,
    showRetryButton: PropTypes.bool,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    testID: PropTypes.string
};

export default React.memo(ErrorView);
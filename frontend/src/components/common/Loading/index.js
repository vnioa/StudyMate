// components/common/Loading/index.js
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';

const Loading = ({
                     size = 'large',
                     color = '#007AFF',
                     message = '로딩 중...',
                     overlay = false,
                     spinnerOnly = false,
                     style
                 }) => {
    if (spinnerOnly) {
        return (
            <ActivityIndicator
                size={size}
                color={color}
                style={[styles.spinner, style]}
            />
        );
    }

    const containerStyle = [
        styles.container,
        overlay && styles.overlay,
        style
    ];

    return (
        <View style={containerStyle}>
            <View style={styles.content}>
                <ActivityIndicator
                    size={size}
                    color={color}
                    style={styles.spinner}
                />
                {message && (
                    <Text style={styles.message}>{message}</Text>
                )}
            </View>
        </View>
    );
};

Loading.propTypes = {
    size: PropTypes.oneOf(['small', 'large']),
    color: PropTypes.string,
    message: PropTypes.string,
    overlay: PropTypes.bool,
    spinnerOnly: PropTypes.bool,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
};

export default React.memo(Loading);
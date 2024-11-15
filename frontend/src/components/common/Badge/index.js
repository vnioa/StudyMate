// components/common/Badge/index.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';
import styles from './styles';

const Badge = ({
                   type,
                   size = 'medium',
                   icon,
                   label,
                   count,
                   color,
                   backgroundColor,
                   onPress,
                   disabled = false,
                   style,
                   showAnimation = false
               }) => {
    // 배지 크기별 스타일 매핑
    const sizeStyles = {
        small: styles.badgeSmall,
        medium: styles.badgeMedium,
        large: styles.badgeLarge
    };

    // 배지 타입별 기본 설정
    const badgeTypes = {
        achievement: {
            icon: 'trophy',
            color: '#FFD700',
            backgroundColor: '#FFF7E6'
        },
        progress: {
            icon: 'chart-line',
            color: '#4CAF50',
            backgroundColor: '#E8F5E9'
        },
        study: {
            icon: 'book-open-page-variant',
            color: '#2196F3',
            backgroundColor: '#E3F2FD'
        },
        group: {
            icon: 'account-group',
            color: '#9C27B0',
            backgroundColor: '#F3E5F5'
        },
        notification: {
            icon: 'bell',
            color: '#FF5722',
            backgroundColor: '#FBE9E7'
        }
    };

    // 배지 타입 기본 설정 가져오기
    const defaultSettings = badgeTypes[type] || badgeTypes.achievement;

    // 사용자 정의 색상 또는 기본 색상 사용
    const badgeColor = color || defaultSettings.color;
    const badgeBackgroundColor = backgroundColor || defaultSettings.backgroundColor;
    const badgeIcon = icon || defaultSettings.icon;

    // 배지 컨테이너 스타일
    const containerStyle = [
        styles.container,
        sizeStyles[size],
        { backgroundColor: badgeBackgroundColor },
        showAnimation && styles.animate,
        style
    ];

    // 배지 내용 렌더링
    const renderBadgeContent = () => (
        <>
            {badgeIcon && (
                <Icon
                    name={badgeIcon}
                    size={size === 'small' ? 16 : size === 'medium' ? 20 : 24}
                    color={badgeColor}
                    style={styles.icon}
                />
            )}
            {label && (
                <Text style={[
                    styles.label,
                    { color: badgeColor },
                    size === 'small' && styles.labelSmall
                ]}>
                    {label}
                </Text>
            )}
            {count > 0 && (
                <View style={[styles.countContainer, { backgroundColor: badgeColor }]}>
                    <Text style={styles.count}>
                        {count > 99 ? '99+' : count}
                    </Text>
                </View>
            )}
        </>
    );

    // 클릭 가능한 배지인 경우 TouchableOpacity로 감싸기
    if (onPress && !disabled) {
        return (
            <TouchableOpacity
                style={containerStyle}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.7}
            >
                {renderBadgeContent()}
            </TouchableOpacity>
        );
    }

    // 일반 배지 렌더링
    return (
        <View style={containerStyle}>
            {renderBadgeContent()}
        </View>
    );
};

Badge.propTypes = {
    type: PropTypes.oneOf(['achievement', 'progress', 'study', 'group', 'notification']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    icon: PropTypes.string,
    label: PropTypes.string,
    count: PropTypes.number,
    color: PropTypes.string,
    backgroundColor: PropTypes.string,
    onPress: PropTypes.func,
    disabled: PropTypes.bool,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    showAnimation: PropTypes.bool
};

Badge.defaultProps = {
    type: 'achievement',
    size: 'medium',
    count: 0,
    disabled: false,
    showAnimation: false
};

export default React.memo(Badge);
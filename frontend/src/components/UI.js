// src/components/UI.js

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Platform,
    ScrollView,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/styles';

const { width } = Dimensions.get('window');

// 버튼 컴포넌트
export const Button = ({
                           onPress,
                           title,
                           type = 'primary',
                           size = 'medium',
                           icon,
                           disabled = false,
                           loading = false,
                           style,
                           textStyle
                       }) => {
    const buttonStyles = [
        styles.button,
        styles[`button_${type}`],
        styles[`button_${size}`],
        disabled && styles.button_disabled,
        style
    ];

    const textStyles = [
        styles.buttonText,
        styles[`buttonText_${type}`],
        styles[`buttonText_${size}`],
        disabled && styles.buttonText_disabled,
        textStyle
    ];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={buttonStyles}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={type === 'primary' ? '#FFF' : theme.colors.primary.main} />
            ) : (
                <View style={styles.buttonContent}>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={size === 'large' ? 24 : 20}
                            color={type === 'primary' ? '#FFF' : theme.colors.primary.main}
                            style={styles.buttonIcon}
                        />
                    )}
                    <Text style={textStyles}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// 입력 필드 컴포넌트
export const Input = ({
                          value,
                          onChangeText,
                          placeholder,
                          secureTextEntry,
                          keyboardType,
                          autoCapitalize = 'none',
                          error,
                          icon,
                          onIconPress,
                          style,
                          multiline,
                          maxLength,
                          label,
                      }) => {
    return (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                error && styles.inputError,
                style
            ]}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    style={[
                        styles.input,
                        icon && styles.inputWithIcon,
                        multiline && styles.inputMultiline
                    ]}
                    multiline={multiline}
                    maxLength={maxLength}
                    placeholderTextColor={theme.colors.text.hint}
                />
                {icon && (
                    <TouchableOpacity onPress={onIconPress} style={styles.inputIcon}>
                        <Ionicons name={icon} size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// 카드 컴포넌트
export const Card = ({
                         children,
                         style,
                         onPress,
                         elevation = 'small'
                     }) => {
    const CardComponent = onPress ? TouchableOpacity : View;

    return (
        <CardComponent
            style={[styles.card, styles[`card_${elevation}`], style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {children}
        </CardComponent>
    );
};

// 모달 컴포넌트
export const CustomModal = ({
                                visible,
                                onClose,
                                title,
                                children,
                                footer,
                                type = 'center'
                            }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[
                    styles.modalContainer,
                    styles[`modal_${type}`]
                ]}>
                    {title && (
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                                <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.modalContent}>
                        {children}
                    </View>
                    {footer && (
                        <View style={styles.modalFooter}>
                            {footer}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// 로딩 인디케이터
export const Loading = ({ size = 'large', color = theme.colors.primary.main }) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size={size} color={color} />
    </View>
);

// 아바타 컴포넌트
export const Avatar = ({
                           source,
                           size = 'medium',
                           onPress,
                           badge
                       }) => {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[styles.avatar, styles[`avatar_${size}`]]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image
                source={typeof source === 'string' ? { uri: source } : source}
                style={[styles.avatarImage, styles[`avatar_${size}`]]}
            />
            {badge && (
                <View style={[styles.avatarBadge, styles[`avatarBadge_${size}`]]}>
                    {typeof badge === 'string' ? (
                        <Text style={styles.avatarBadgeText}>{badge}</Text>
                    ) : badge}
                </View>
            )}
        </Container>
    );
};

// 태그 컴포넌트
export const Tag = ({
                        label,
                        color = theme.colors.primary.main,
                        onPress,
                        size = 'medium'
                    }) => {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[
                styles.tag,
                styles[`tag_${size}`],
                { backgroundColor: color + '20' },
                onPress && styles.tagPressable
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[
                styles.tagText,
                styles[`tagText_${size}`],
                { color }
            ]}>
                {label}
            </Text>
        </Container>
    );
};

// 스타일
const styles = StyleSheet.create({
    // 버튼 스타일
    button: {
        borderRadius: theme.layout.components.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    button_primary: {
        backgroundColor: theme.colors.primary.main,
    },
    button_secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary.main,
    },
    button_text: {
        backgroundColor: 'transparent',
    },
    button_large: {
        height: 54,
        paddingHorizontal: 32,
    },
    button_medium: {
        height: 48,
        paddingHorizontal: 24,
    },
    button_small: {
        height: 36,
        paddingHorizontal: 16,
    },
    button_disabled: {
        opacity: 0.5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.body1,
    },
    buttonText_primary: {
        color: theme.colors.text.contrast,
    },
    buttonText_secondary: {
        color: theme.colors.primary.main,
    },
    buttonText_text: {
        color: theme.colors.primary.main,
    },
    buttonText_large: {
        fontSize: theme.typography.size.h4,
    },
    buttonText_small: {
        fontSize: theme.typography.size.body2,
    },
    buttonText_disabled: {
        opacity: 0.5,
    },

    // 입력 필드 스타일
    inputContainer: {
        marginBottom: theme.spacing.md,
    },
    inputLabel: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.layout.components.borderRadius,
        backgroundColor: theme.colors.background.primary,
    },
    input: {
        flex: 1,
        height: theme.layout.components.inputHeight,
        paddingHorizontal: theme.spacing.md,
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    inputWithIcon: {
        paddingRight: 44,
    },
    inputMultiline: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: theme.spacing.md,
    },
    inputIcon: {
        position: 'absolute',
        right: theme.spacing.md,
    },
    inputError: {
        borderColor: theme.colors.status.error,
    },
    errorText: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.caption,
        color: theme.colors.status.error,
        marginTop: theme.spacing.xs,
    },

    // 카드 스타일
    card: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.components.borderRadius,
        padding: theme.spacing.md,
    },
    card_small: {
        ...theme.shadows.small,
    },
    card_medium: {
        ...theme.shadows.medium,
    },
    card_large: {
        ...theme.shadows.large,
    },

    // 모달 스타일
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.background.modal,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.components.borderRadius,
        width: width - 48,
        maxHeight: '80%',
    },
    modal_bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.h4,
        color: theme.colors.text.primary,
    },
    modalContent: {
        padding: theme.spacing.md,
    },
    modalFooter: {
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },

    // 로딩 스타일
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 아바타 스타일
    avatar: {
        borderRadius: 999,
        overflow: 'hidden',
    },
    avatar_small: {
        width: 32,
        height: 32,
    },
    avatar_medium: {
        width: 48,
        height: 48,
    },
    avatar_large: {
        width: 64,
        height: 64,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarBadge: {
        position: 'absolute',
        right: -2,
        bottom: -2,
        backgroundColor: theme.colors.status.success,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: theme.colors.background.primary,
    },
    avatarBadge_small: {
        width: 12,
        height: 12,
    },
    avatarBadge_medium: {
        width: 16,
        height: 16,
    },
    avatarBadge_large: {
        width: 20,
        height: 20,
    },
    avatarBadgeText: {
        color: theme.colors.text.contrast,
        fontSize: theme.typography.size.caption,
        textAlign: 'center',
    },

    // 태그 스타일
    tag: {
        borderRadius: 999,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    tag_small: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
    },
    tag_large: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    tagPressable: {
        opacity: 0.8,
    },
    tagText: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.caption,
    },
    tagText_small: {
        fontSize: theme.typography.size.small,
    },
    tagText_large: {
        fontSize: theme.typography.size.body2,
    },
});

export default {
    Button,
    Input,
    Card,
    CustomModal,
    Loading,
    Avatar,
    Tag
};
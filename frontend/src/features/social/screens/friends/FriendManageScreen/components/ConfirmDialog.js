// features/social/screens/friend/FriendManageScreen/components/ConfirmDialog.js
import React, { memo, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Easing,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles';

const ConfirmDialog = ({
                           visible,
                           title = '확인',
                           message,
                           confirmText = '확인',
                           cancelText = '취소',
                           confirmStyle = 'destructive', // 'default' | 'destructive'
                           onConfirm,
                           onCancel,
                           onClose
                       }) => {
    // 애니메이션 값
    const scaleValue = new Animated.Value(0);
    const opacityValue = new Animated.Value(0);

    // 애니메이션 실행
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    tension: Platform.select({ ios: 50, android: 40 }),
                    friction: Platform.select({ ios: 7, android: 5 }),
                    useNativeDriver: true
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: Platform.select({ ios: 200, android: 150 }),
                    easing: Easing.ease,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleValue, {
                    toValue: 0,
                    duration: Platform.select({ ios: 200, android: 150 }),
                    useNativeDriver: true
                }),
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: Platform.select({ ios: 200, android: 150 }),
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [visible, scaleValue, opacityValue]);

    // 닫기 처리
    const handleClose = () => {
        if (Platform.OS === 'ios') {
            // iOS에서는 페이드 아웃 애니메이션 후 닫기
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start(() => {
                onClose?.();
                onCancel?.();
            });
        } else {
            // Android에서는 즉시 닫기
            onClose?.();
            onCancel?.();
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent={Platform.OS === 'android'}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={[
                    styles.dialogOverlay,
                    Platform.OS === 'android' && styles.dialogOverlayAndroid
                ]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.dialogContainer,
                                Platform.select({
                                    ios: styles.dialogContainerIOS,
                                    android: styles.dialogContainerAndroid
                                }),
                                {
                                    transform: [{ scale: scaleValue }],
                                    opacity: opacityValue
                                }
                            ]}
                        >
                            {/* 헤더 */}
                            <View style={[
                                styles.dialogHeader,
                                Platform.OS === 'ios' && styles.dialogHeaderIOS
                            ]}>
                                <Text style={[
                                    styles.dialogTitle,
                                    Platform.select({
                                        ios: styles.dialogTitleIOS,
                                        android: styles.dialogTitleAndroid
                                    })
                                ]}>
                                    {title}
                                </Text>
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity
                                        style={styles.dialogCloseButton}
                                        onPress={handleClose}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={24}
                                            color="#8E8E93"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* 내용 */}
                            <View style={[
                                styles.dialogContent,
                                Platform.select({
                                    ios: styles.dialogContentIOS,
                                    android: styles.dialogContentAndroid
                                })
                            ]}>
                                <Text style={[
                                    styles.dialogMessage,
                                    Platform.select({
                                        ios: styles.dialogMessageIOS,
                                        android: styles.dialogMessageAndroid
                                    })
                                ]}>
                                    {message}
                                </Text>
                            </View>

                            {/* 버튼 */}
                            <View style={[
                                styles.dialogActions,
                                Platform.select({
                                    ios: styles.dialogActionsIOS,
                                    android: styles.dialogActionsAndroid
                                })
                            ]}>
                                <TouchableOpacity
                                    style={[
                                        styles.dialogButton,
                                        styles.dialogCancelButton,
                                        Platform.OS === 'ios' && styles.dialogButtonIOS
                                    ]}
                                    onPress={handleClose}
                                >
                                    <Text style={[
                                        styles.dialogCancelText,
                                        Platform.OS === 'ios' && styles.dialogButtonTextIOS
                                    ]}>
                                        {cancelText}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.dialogButton,
                                        styles.dialogConfirmButton,
                                        confirmStyle === 'destructive' && styles.dialogDestructiveButton,
                                        Platform.OS === 'ios' && styles.dialogButtonIOS
                                    ]}
                                    onPress={() => {
                                        onConfirm?.();
                                        onClose?.();
                                    }}
                                >
                                    <Text style={[
                                        styles.dialogConfirmText,
                                        confirmStyle === 'destructive' && styles.dialogDestructiveText,
                                        Platform.OS === 'ios' && styles.dialogButtonTextIOS
                                    ]}>
                                        {confirmText}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

ConfirmDialog.defaultProps = {
    visible: false,
    title: '확인',
    confirmText: '확인',
    cancelText: '취소',
    confirmStyle: 'destructive',
    onConfirm: null,
    onCancel: null,
    onClose: null
};

export default memo(ConfirmDialog);
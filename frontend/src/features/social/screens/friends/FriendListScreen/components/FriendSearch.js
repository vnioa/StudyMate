// features/social/screens/friend/FriendListScreen/components/FriendSearch.js
import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import styles from '../styles';

const FriendSearch = ({
                          value,
                          onChangeText,
                          onClear,
                          onFocus,
                          onBlur,
                          placeholder = '친구 검색',
                          autoFocus = false,
                          disabled = false
                      }) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const inputRef = useRef(null);

    // 검색어 변경 처리 (디바운스 적용)
    const handleChangeText = useCallback(
        debounce((text) => {
            onChangeText?.(text);
        }, 300),
        [onChangeText]
    );

    // 포커스 처리
    const handleFocus = useCallback(() => {
        setIsFocused(true);
        onFocus?.();
        Animated.spring(animatedWidth, {
            toValue: 1,
            useNativeDriver: false
        }).start();
    }, [animatedWidth, onFocus]);

    // 블러 처리
    const handleBlur = useCallback(() => {
        if (!value) {
            setIsFocused(false);
            Animated.spring(animatedWidth, {
                toValue: 0,
                useNativeDriver: false
            }).start();
        }
        onBlur?.();
    }, [value, animatedWidth, onBlur]);

    // 초기화 처리
    const handleClear = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.clear();
        }
        onChangeText?.('');
        onClear?.();
    }, [onChangeText, onClear]);

    // 컴포넌트 언마운트 시 디바운스 취소
    useEffect(() => {
        return () => {
            handleChangeText.cancel();
        };
    }, [handleChangeText]);

    return (
        <View style={styles.searchContainer}>
            <Animated.View
                style={[
                    styles.searchInputContainer,
                    {
                        flex: animatedWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1]
                        })
                    }
                ]}
            >
                <Ionicons
                    name="search"
                    size={20}
                    color={isFocused ? "#0057D9" : "#8E8E93"}
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    placeholder={placeholder}
                    placeholderTextColor="#8E8E93"
                    value={value}
                    onChangeText={(text) => {
                        handleChangeText(text);
                        // 즉시 UI 업데이트를 위한 로컬 상태 변경
                        if (inputRef.current) {
                            inputRef.current.setNativeProps({ text });
                        }
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    autoFocus={autoFocus}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                    editable={!disabled}
                />
                {value ? (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={handleClear}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color="#8E8E93"
                        />
                    </TouchableOpacity>
                ) : null}
            </Animated.View>
        </View>
    );
};

FriendSearch.defaultProps = {
    value: '',
    placeholder: '친구 검색',
    autoFocus: false,
    disabled: false,
    onChangeText: null,
    onClear: null,
    onFocus: null,
    onBlur: null
};

export default memo(FriendSearch);
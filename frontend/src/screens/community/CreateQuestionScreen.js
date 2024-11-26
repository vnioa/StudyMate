import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CreateQuestionScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [titleError, setTitleError] = useState('');
    const [contentError, setContentError] = useState('');

    const validateForm = () => {
        let isValid = true;

        if (!title.trim()) {
            setTitleError('제목을 입력해주세요');
            isValid = false;
        } else {
            setTitleError('');
        }

        if (!content.trim()) {
            setContentError('내용을 입력해주세요');
            isValid = false;
        } else {
            setContentError('');
        }

        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            // API 호출
            const response = await questionApi.createQuestion({
                title: title.trim(),
                content: content.trim(),
            });

            Alert.alert('성공', '질문이 등록되었습니다', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('오류', '질문 등록에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (title.trim() || content.trim()) {
            Alert.alert(
                '작성 취소',
                '작성 중인 내용이 있습니다. 정말 나가시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    { text: '나가기', style: 'destructive', onPress: () => navigation.goBack() }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>질문하기</Text>
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!title.trim() || !content.trim()) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || !title.trim() || !content.trim()}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>등록</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.titleInput, titleError && styles.inputError]}
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />
                    {titleError ? (
                        <Text style={styles.errorText}>{titleError}</Text>
                    ) : (
                        <Text style={styles.charCount}>{title.length}/100</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.contentInput, contentError && styles.inputError]}
                        placeholder="질문 내용을 자세히 작성해주세요"
                        multiline
                        value={content}
                        onChangeText={setContent}
                        textAlignVertical="top"
                    />
                    {contentError && (
                        <Text style={styles.errorText}>{contentError}</Text>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    submitButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#4A90E2',
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    inputContainer: {
        marginBottom: 20,
    },
    titleInput: {
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 12,
        marginBottom: 4,
    },
    contentInput: {
        fontSize: 15,
        height: 300,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 4,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    charCount: {
        color: '#666',
        fontSize: 12,
        textAlign: 'right',
    },
});

export default CreateQuestionScreen;
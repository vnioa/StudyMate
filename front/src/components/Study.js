// src/components/Study.js

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/styles';
import { Card } from './UI';

// 학습 타이머 컴포넌트
export const StudyTimer = ({
                               time,
                               isRunning,
                               mode = 'study',
                               onStart,
                               onPause,
                               onReset
                           }) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return (
        <Card style={styles.timerCard}>
            <View style={styles.timerHeader}>
                <Text style={styles.timerTitle}>
                    {mode === 'study' ? '학습 시간' : '휴식 시간'}
                </Text>
                <View style={[
                    styles.timerMode,
                    { backgroundColor: theme.colors.study.timer[mode] }
                ]}>
                    <Text style={styles.timerModeText}>
                        {mode === 'study' ? '학습 중' : '휴식 중'}
                    </Text>
                </View>
            </View>
            <Text style={styles.timerText}>
                {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
            </Text>
            <View style={styles.timerControls}>
                {isRunning ? (
                    <TouchableOpacity style={styles.timerButton} onPress={onPause}>
                        <Ionicons name="pause" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.timerButton} onPress={onStart}>
                        <Ionicons name="play" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.timerButton} onPress={onReset}>
                    <Ionicons name="refresh" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>
        </Card>
    );
};

// 학습 진행률 컴포넌트
export const StudyProgress = ({
                                  progress,
                                  total,
                                  label,
                                  color = theme.colors.primary.main
                              }) => {
    const percentage = (progress / total) * 100;

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{label}</Text>
                <Text style={styles.progressText}>{`${progress}/${total}`}</Text>
            </View>
            <View style={styles.progressBar}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: `${percentage}%`,
                            backgroundColor: color
                        }
                    ]}
                />
            </View>
        </View>
    );
};

// 학습 통계 카드 컴포넌트
export const StudyStatsCard = ({
                                   title,
                                   value,
                                   unit,
                                   icon,
                                   trend,
                                   color = theme.colors.primary.main
                               }) => {
    return (
        <Card style={styles.statsCard}>
            <View style={styles.statsHeader}>
                <Ionicons name={icon} size={24} color={color} />
                <Text style={styles.statsTitle}>{title}</Text>
            </View>
            <View style={styles.statsContent}>
                <Text style={styles.statsValue}>{value}</Text>
                <Text style={styles.statsUnit}>{unit}</Text>
            </View>
            {trend && (
                <View style={[
                    styles.statsTrend,
                    {
                        backgroundColor: trend > 0
                            ? theme.colors.status.success + '20'
                            : theme.colors.status.error + '20'
                    }
                ]}>
                    <Ionicons
                        name={trend > 0 ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={trend > 0 ? theme.colors.status.success : theme.colors.status.error}
                    />
                    <Text style={[
                        styles.statsTrendText,
                        {
                            color: trend > 0
                                ? theme.colors.status.success
                                : theme.colors.status.error
                        }
                    ]}>
                        {`${Math.abs(trend)}%`}
                    </Text>
                </View>
            )}
        </Card>
    );
};

// 퀴즈 카드 컴포넌트
export const QuizCard = ({
                             question,
                             options,
                             selectedOption,
                             onSelect,
                             showAnswer,
                             correctAnswer
                         }) => {
    return (
        <Card style={styles.quizCard}>
            <Text style={styles.quizQuestion}>{question}</Text>
            <View style={styles.quizOptions}>
                {options.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.quizOption,
                            selectedOption === index && styles.quizOptionSelected,
                            showAnswer && correctAnswer === index && styles.quizOptionCorrect,
                            showAnswer && selectedOption === index &&
                            selectedOption !== correctAnswer && styles.quizOptionWrong
                        ]}
                        onPress={() => onSelect(index)}
                        disabled={showAnswer}
                    >
                        <Text style={[
                            styles.quizOptionText,
                            selectedOption === index && styles.quizOptionTextSelected,
                            showAnswer && correctAnswer === index && styles.quizOptionTextCorrect,
                            showAnswer && selectedOption === index &&
                            selectedOption !== correctAnswer && styles.quizOptionTextWrong
                        ]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Card>
    );
};

// 학습 자료 카드 컴포넌트
export const StudyMaterialCard = ({
                                      title,
                                      subject,
                                      progress,
                                      lastStudied,
                                      onPress
                                  }) => {
    return (
        <Card style={styles.materialCard} onPress={onPress}>
            <View style={styles.materialHeader}>
                <Text style={styles.materialTitle}>{title}</Text>
                <View style={[
                    styles.materialSubject,
                    { backgroundColor: theme.colors.study.subject[subject.toLowerCase()] + '20' }
                ]}>
                    <Text style={[
                        styles.materialSubjectText,
                        { color: theme.colors.study.subject[subject.toLowerCase()] }
                    ]}>
                        {subject}
                    </Text>
                </View>
            </View>
            <StudyProgress
                progress={progress}
                total={100}
                color={theme.colors.study.subject[subject.toLowerCase()]}
            />
            <Text style={styles.materialLastStudied}>
                마지막 학습: {lastStudied}
            </Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    // 타이머 스타일
    timerCard: {
        padding: theme.spacing.lg,
    },
    timerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    timerTitle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.h4,
        color: theme.colors.text.primary,
    },
    timerMode: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.components.borderRadius,
    },
    timerModeText: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.contrast,
    },
    timerText: {
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: 48,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginVertical: theme.spacing.lg,
    },
    timerControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
    timerButton: {
        padding: theme.spacing.sm,
    },

    // 진행률 스타일
    progressContainer: {
        marginVertical: theme.spacing.sm,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    progressLabel: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
    },
    progressText: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.grey[200],
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },

    // 통계 카드 스타일
    statsCard: {
        padding: theme.spacing.md,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    statsTitle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
    },
    statsContent: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: theme.spacing.xs,
    },
    statsValue: {
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: theme.typography.size.h3,
        color: theme.colors.text.primary,
    },
    statsUnit: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.body2,
        color: theme.colors.text.secondary,
    },
    statsTrend: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.components.borderRadius,
        marginTop: theme.spacing.sm,
    },
    statsTrendText: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.caption,
    },

    // 퀴즈 카드 스타일
    quizCard: {
        padding: theme.spacing.lg,
    },
    quizQuestion: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.h4,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    quizOptions: {
        gap: theme.spacing.md,
    },
    quizOption: {
        padding: theme.spacing.md,
        borderRadius: theme.layout.components.borderRadius,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    quizOptionSelected: {
        backgroundColor: theme.colors.primary.main + '20',
        borderColor: theme.colors.primary.main,
    },
    quizOptionCorrect: {
        backgroundColor: theme.colors.status.success + '20',
        borderColor: theme.colors.status.success,
    },
    quizOptionWrong: {
        backgroundColor: theme.colors.status.error + '20',
        borderColor: theme.colors.status.error,
    },
    quizOptionText: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
    },
    quizOptionTextSelected: {
        color: theme.colors.primary.main,
    },
    quizOptionTextCorrect: {
        color: theme.colors.status.success,
    },
    quizOptionTextWrong: {
        color: theme.colors.status.error,
    },

    // 학습 자료 카드 스타일
    materialCard: {
        padding: theme.spacing.md,
    },
    materialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    materialTitle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.body1,
        color: theme.colors.text.primary,
        flex: 1,
    },
    materialSubject: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.components.borderRadius,
    },
    materialSubjectText: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.size.caption,
    },
    materialLastStudied: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.size.caption,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.sm,
    },
});

export default {
    StudyTimer,
    StudyProgress,
    StudyStatsCard,
    QuizCard,
    StudyMaterialCard
};
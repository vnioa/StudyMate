// features/home/components/GoalSection/Reminders.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useGoals } from '../../hooks/useGoals';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';

const Reminders = () => {
    const { reminders, toggleReminder } = useGoals();

    const renderReminderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.reminderItem}
            onPress={() => toggleReminder(item.id)}
        >
            <View style={styles.reminderContent}>
                <Icon
                    name={item.isEnabled ? "bell" : "bell-off"}
                    size={20}
                    color={item.isEnabled ? "#007AFF" : "#666666"}
                />
                <View style={styles.reminderTexts}>
                    <Text style={styles.reminderTitle}>{item.title}</Text>
                    <Text style={styles.reminderTime}>{item.time}</Text>
                </View>
            </View>
            <Icon
                name={item.isEnabled ? "toggle-switch" : "toggle-switch-off"}
                size={24}
                color={item.isEnabled ? "#007AFF" : "#666666"}
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.reminderContainer}>
            <View style={styles.header}>
                <Text style={styles.title}>학습 리마인더</Text>
                <TouchableOpacity>
                    <Text style={styles.settingsText}>설정</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={reminders}
                renderItem={renderReminderItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default Reminders;
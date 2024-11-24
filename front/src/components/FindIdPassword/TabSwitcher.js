import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import {styles} from '../../styles/FindIdPasswordStyles';

const TabSwitcher = ({ isIdTab, setIsIdTab }) => (
    <View style={styles.tabContainer}>
        <TouchableOpacity
            style={[styles.tabButton, isIdTab && styles.activeTab]}
            onPress={() => setIsIdTab(true)}
        >
            <Text style={[styles.tabText, isIdTab && styles.activeTabText]}>아이디 찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.tabButton, !isIdTab && styles.activeTab]}
            onPress={() => setIsIdTab(false)}
        >
            <Text style={[styles.tabText, !isIdTab && styles.activeTabText]}>비밀번호 찾기</Text>
        </TouchableOpacity>
    </View>
);

export default TabSwitcher;
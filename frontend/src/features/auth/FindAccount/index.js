import React, { useState } from 'react';
import { View, Animated } from 'react-native';
import FindIdTab from './FindIdTab';
import FindPasswordTab from './FindPasswordTab';
import TabSelector from '../../../components/common/TabSelector';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './styles';

const FindAccountScreen = () => {
    const [activeTab, setActiveTab] = useState('id');
    const slideAnim = new Animated.Value(0);

    const tabs = [
        { id: 'id', label: '아이디 찾기' },
        { id: 'password', label: '비밀번호 찾기' }
    ];

    const handleTabChange = (tabId) => {
        const toValue = tabId === 'id' ? 0 : 1;
        setActiveTab(tabId);

        Animated.timing(slideAnim, {
            toValue,
            duration: 300,
            useNativeDriver: true
        }).start();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TabSelector
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
                <Animated.View
                    style={[
                        styles.tabContent,
                        {
                            transform: [{
                                translateX: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -400]
                                })
                            }]
                        }
                    ]}
                >
                    {activeTab === 'id' ? <FindIdTab /> : <FindPasswordTab />}
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

export default FindAccountScreen;
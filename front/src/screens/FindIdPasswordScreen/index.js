import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import TabSwitcher from '../../components/FindIdPassword/TabSwitcher';
import IdFindForm from '../../components/FindIdPassword/IdFindForm';
import PasswordFindForm from '../../components/FindIdPassword/PasswordFindForm';
import styles from '../../styles/FindIdPasswordStyles';

const FindIdPasswordScreen = ({ navigation }) => {
    const [isIdTab, setIsIdTab] = useState(true);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* 탭 전환 */}
            <TabSwitcher isIdTab={isIdTab} setIsIdTab={setIsIdTab} />

            {/* 폼 렌더링 */}
            {isIdTab ? (
                <IdFindForm />
            ) : (
                <PasswordFindForm navigation={navigation} />
            )}
        </SafeAreaView>
    );
};

export default FindIdPasswordScreen;
// screens/intro/index.js
import React from 'react';
import { View, Image } from 'react-native';
import IntroTitle from './components/IntroTitle';
import IntroButtons from './components/IntroButtons';
import { useIntro } from './hooks/useIntro';
import styles from './styles';

const IntroScreen = ({ navigation }) => {
    const { fadeAnim } = useIntro();

    return (
        <View style={styles.container}>
            <IntroTitle fadeAnim={fadeAnim} />
            <Image
                source={require('../../assets/icons/study-group.png')}
                style={styles.image}
                resizeMode="contain"
            />
            <IntroButtons navigation={navigation} />
        </View>
    );
};

export default IntroScreen;
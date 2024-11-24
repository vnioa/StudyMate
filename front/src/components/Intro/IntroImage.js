import React from 'react';
import { Image } from 'react-native';
import styles from '../../styles/IntroScreenStyles';

const IntroImage = () => (
    <Image
        source={require('../../assets/study-group.png')} // 이미지 경로 수정 필요
        style={styles.image}
        resizeMode="contain"
    />
);

export default IntroImage;
// 파일 만료 설정 기능 -> 파일이 일정 시간 후 삭제되도록 만료 날짜 설정 가능

import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { setFileExpiration } from '../../api/chat';

const FileExpirationSetter = ({ fileId }) => {
    const [expirationDate, setExpirationDate] = useState(new Date());

    const handleSetExpiration = async () => {
        try {
            await setFileExpiration(fileId, expirationDate);
            Alert.alert('파일 만료 설정이 완료되었습니다.');
        } catch (error) {
            Alert.alert('파일 만료 설정 실패', error.message);
        }
    };

    return (
        <View>
            <DateTimePicker
                value={expirationDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => setExpirationDate(selectedDate || expirationDate)}
            />
            <Button title="만료 날짜 설정" onPress={handleSetExpiration} />
        </View>
    );
};

export default FileExpirationSetter;

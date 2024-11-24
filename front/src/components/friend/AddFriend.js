import React, { useState } from 'react';
import { TextInput, Button } from 'react-native';

const AddFriend = ({ onAddFriend }) => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');

    return (
        <>
            <TextInput
                value={usernameOrEmail}
                onChangeText={setUsernameOrEmail}
                placeholder="ID나 이메일을 입력하세요"
            />
            <Button title="친구 요청 전송" onPress={() => onAddFriend(usernameOrEmail)} />
        </>
    );
};

export default AddFriend;
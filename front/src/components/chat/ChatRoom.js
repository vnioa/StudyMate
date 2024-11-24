import React, {useState} from 'react';
import {FlatList, TextInput, Button, View} from 'react-native';

const ChatRoom = ({messages, onSendMessage}) => {
    const [message, setMessage] = useState('');

    return (
        <View>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => <Text>{item.text}</Text>}
            />
            <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="메시지 입력"
            />
            <Button title="전송" onPress={() => onSendMessage(message)}/>
        </View>
    );
};

export default ChatRoom;
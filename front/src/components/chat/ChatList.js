import React from 'react';
import {FlatList, Text, View} from 'react-native';

const ChatList = ({chats}) => {
    return (
        <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={({item}) => (
                <View>
                    <Text>{item.name}</Text>
                    <Text>{item.lastMessage}</Text>
                </View>
            )}
        />
    );
};

export default ChatList;
import React from 'react';
import { FlatList, Button, View } from 'react-native';

const FriendList = ({ friends, onRemoveFriend }) => {
    return (
        <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View>
                    <Text>{item.name}</Text>
                    <Button title="친구 삭제" onPress={() => onRemoveFriend(item.id)} />
                </View>
            )}
        />
    );
};

export default FriendList;
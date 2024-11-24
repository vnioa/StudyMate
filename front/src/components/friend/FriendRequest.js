import React from 'react';
import { FlatList, Button } from 'react-native';

const FriendRequest = ({ requests, onAcceptRequest, onDeclineRequest }) => {
    return (
        <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <>
                    <Text>{item.name}</Text>
                    <Button title="수락" onPress={() => onAcceptRequest(item.id)} />
                    <Button title="거절" onPress={() => onDeclineRequest(item.id)} />
                </>
            )}
        />
    );
};

export default FriendRequest;
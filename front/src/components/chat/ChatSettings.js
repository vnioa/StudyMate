import React from 'react';
import {View, TextInput, Switch} from 'react-native';

const ChatSettings = ({settings, onUpdateSettings}) => {
    return (
        <View>
            <TextInput
                value={settings.name}
                onChangeText={(text) => onUpdateSettings({...settings, text})}
                placeholder="채팅방 이름"
            />
            <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => onUpdateSettings({...settings, notificationsEnabled: value})}
            />
        </View>
    );
};

export default ChatSettings;
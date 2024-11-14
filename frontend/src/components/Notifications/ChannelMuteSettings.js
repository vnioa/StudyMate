// components/Notifications/ChannelMuteSettings.js

import React, { useState } from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import { muteChannel } from '../../api/notifications';

const ChannelMuteSettings = ({ channelId }) => {
    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = async () => {
        const mute = !isMuted;
        setIsMuted(mute);

        try {
            await muteChannel(channelId, mute);
            Alert.alert('Notification', `Channel ${mute ? 'muted' : 'unmuted'}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update mute setting');
        }
    };

    return (
        <View>
            <Text>이 채팅방 음소거</Text>
            <Switch value={isMuted} onValueChange={toggleMute} />
        </View>
    );
};

export default ChannelMuteSettings;

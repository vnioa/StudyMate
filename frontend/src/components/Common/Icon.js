// src/components/Common/Icon.js

import React from 'react';
import { FontAwesome, MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';

const Icon = ({ name, type = 'FontAwesome', size = 24, color = '#000', style }) => {
    const renderIcon = () => {
        switch (type) {
            case 'FontAwesome':
                return <FontAwesome name={name} size={size} color={color} style={style} />;
            case 'MaterialIcons':
                return <MaterialIcons name={name} size={size} color={color} style={style} />;
            case 'Ionicons':
                return <Ionicons name={name} size={size} color={color} style={style} />;
            case 'Entypo':
                return <Entypo name={name} size={size} color={color} style={style} />;
            default:
                return <FontAwesome name={name} size={size} color={color} style={style} />;
        }
    };

    return renderIcon();
};

export default Icon;

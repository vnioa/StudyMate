// src/contexts/ThemeContext.js

import React, { createContext, useState, useContext } from 'react';
import { theme as defaultTheme } from '../utils/styles';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(defaultTheme);
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        setTheme(prev => ({
            ...prev,
            isDark: !isDark,
            colors: {
                ...prev.colors,
                background: {
                    primary: isDark ? '#FFFFFF' : '#000000',
                    secondary: isDark ? '#F8F9FA' : '#1A1A1A'
                },
                text: {
                    primary: isDark ? '#000000' : '#FFFFFF',
                    secondary: isDark ? '#6C757D' : '#ADB5BD',
                    contrast: isDark ? '#FFFFFF' : '#000000'
                }
            }
        }));
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
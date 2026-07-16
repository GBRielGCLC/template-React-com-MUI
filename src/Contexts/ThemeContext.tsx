import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, Box } from '@mui/material';

import { DarkTheme, LightTheme } from '../Themes';

interface IThemeContextData {
    themeName: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext({} as IThemeContextData);

export const useAppThemeContext = () => {
    return useContext(ThemeContext);
}

interface IAppThemeProviderProps {
    children: React.ReactNode
}
export const AppThemeProvider: React.FC<IAppThemeProviderProps> = ({ children }) => {
    const browserTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';

    var localStorageThemeName: 'light' | 'dark' = browserTheme;
    if (localStorage.getItem('themeName') !== null) {

        if (localStorage.getItem('themeName') === 'dark') {
            localStorageThemeName = 'dark';
        } else {
            localStorageThemeName = 'light';
        }

    }
    const [themeName, setThemeName] = useState<'light' | 'dark'>(localStorageThemeName);

    useEffect(() => {
        if (!document.getElementById('view-transition-styles')) {
            const style = document.createElement('style');
            style.id = 'view-transition-styles';
            style.textContent = `
                ::view-transition-old(root) {
                    animation: none;
                }
                ::view-transition-new(root) {
                    animation: clip-reveal 1500ms ease-in-out;
                }
                @keyframes clip-reveal {
                    from {
                        clip-path: circle(0 at var(--toggle-x, 50%) var(--toggle-y, 50%));
                    }
                    to {
                        clip-path: circle(150% at var(--toggle-x, 50%) var(--toggle-y, 50%));
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        if ((document as any).startViewTransition) {
            (document as any).startViewTransition(() => {
                setThemeName(oldThemeName => oldThemeName === 'light' ? 'dark' : 'light');
            });
        } else {
            setThemeName(oldThemeName => oldThemeName === 'light' ? 'dark' : 'light');
        }
    }, []);

    const theme = useMemo(() => {
        localStorage.setItem('themeName', themeName);

        return {
            ...themeName === 'light' ? LightTheme : DarkTheme,
        }
    }, [themeName]);

    return (
        <ThemeContext.Provider value={{ themeName, toggleTheme }}>
            <ThemeProvider theme={theme}>
                <Box minHeight="100vh" bgcolor={theme.palette.background.default}>
                    {children}
                </Box>
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}

import { createTheme } from '@mui/material';
import { getBaseTheme } from './Base';
import { blue, cyan, grey } from '@mui/material/colors';

export const DarkTheme = createTheme(getBaseTheme('dark'), {
    palette: {
        primary: {
            main: "#0075a3",
            dark: blue[700],
            light: "#00aeea",
            contrastText: '#ffffff',
        },
        secondary: {
            main: cyan[400],
            dark: cyan[300],
            light: cyan[200],
            contrastText: '#000000',
        },
        background: {
            paper: '#1c1c1c',
            default: '#121212',
        },
        text: {
            primary: '#ffffff',
            secondary: grey[400],
        },
        divider: '#2f3330',
    },
    typography: {
        subtitle1: {
            color: '#ffffff',
        }
    },
    components: {
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1c1c1c',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0px 4px 6px rgba(255, 255, 255, 0.06)',
                    borderRadius: 8,
                },
                columnHeader: {
                    background: '#0D47A1',
                    color: '#ffffff',
                    fontWeight: 'bold',
                },
                row: {
                    '&:nth-of-type(odd)': {
                        backgroundColor: '#222222',
                    },
                    '&:nth-of-type(even)': {
                        backgroundColor: '#1c1c1c',
                    },
                    '&:hover': {
                        backgroundColor: '#333333',
                    },
                },
            },
        },
    },
});

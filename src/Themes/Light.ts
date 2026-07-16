import { createTheme } from '@mui/material';
import { getBaseTheme } from './Base';
import { blue, cyan, grey } from '@mui/material/colors';

export const LightTheme = createTheme(getBaseTheme('light'), {
    palette: {
        primary: {
            main: "#083c94",
            dark: blue[600],
            light: blue[400],
            contrastText: '#ffffff',
        },
        secondary: {
            main: cyan[700],
            dark: cyan[800],
            light: cyan[600],
            contrastText: '#ffffff',
        },
        background: {
            paper: '#f9f9f9',
            default: grey[200],
        },
        text: {
            secondary: grey[700],
        }
    },
    components: {
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.05)',
                    borderRadius: 8,
                },
                columnHeader: {
                    background: '#0D47A1',
                    color: '#ffffff',
                    fontWeight: 'bold',
                },
                row: {
                    '&:nth-of-type(odd)': {
                        backgroundColor: '#ffffff',
                    },
                    '&:nth-of-type(even)': {
                        backgroundColor: '#f5f5f5',
                    },
                    '&:hover': {
                        backgroundColor: '#eaeaea',
                    },
                },
            },
        },
    },
});

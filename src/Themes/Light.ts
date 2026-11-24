import { createTheme } from '@mui/material';
import { getBaseTheme } from './Base';
import { grey } from '@mui/material/colors';
import { brand, brandGradient } from './Brand';

export const LightTheme = createTheme(getBaseTheme('light'), {
    palette: {
        primary: {
            main: brand.violet.main,
            dark: brand.violet.dark,
            light: brand.violet.light,
            contrastText: '#ffffff',
        },
        secondary: {
            main: brand.teal.main,
            dark: brand.teal.dark,
            light: brand.teal.light,
            contrastText: '#ffffff',
        },
        background: {
            paper: '#ffffff',
            default: '#f4f4f9',
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
                    background: brandGradient,
                    color: '#ffffff',
                    fontWeight: 'bold',
                },
                row: {
                    '&:nth-of-type(odd)': {
                        backgroundColor: '#ffffff',
                    },
                    '&:nth-of-type(even)': {
                        backgroundColor: '#f5f5f9',
                    },
                    '&:hover': {
                        backgroundColor: '#eeeeF5',
                    },
                },
            },
        },
    },
});

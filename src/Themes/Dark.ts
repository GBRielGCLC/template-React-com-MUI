import { createTheme } from '@mui/material';
import { getBaseTheme } from './Base';
import { grey } from '@mui/material/colors';
import { brand, brandGradient } from './Brand';

export const DarkTheme = createTheme(getBaseTheme('dark'), {
    palette: {
        primary: {
            main: brand.violet.light,
            dark: brand.violet.main,
            light: '#9BA1DC',
            contrastText: '#ffffff',
        },
        secondary: {
            main: brand.teal.light,
            dark: brand.teal.main,
            light: '#8AD6D0',
            contrastText: '#10231f',
        },
        background: {
            paper: '#1a1a24',
            default: '#121218',
        },
        text: {
            primary: '#ffffff',
            secondary: grey[400],
        },
        divider: '#2f2f3d',
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
                    backgroundColor: '#1a1a24',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0px 4px 6px rgba(255, 255, 255, 0.06)',
                    borderRadius: 8,
                },
                columnHeader: {
                    background: brandGradient,
                    color: '#ffffff',
                    fontWeight: 'bold',
                },
                row: {
                    '&:nth-of-type(odd)': {
                        backgroundColor: '#22222e',
                    },
                    '&:nth-of-type(even)': {
                        backgroundColor: '#1a1a24',
                    },
                    '&:hover': {
                        backgroundColor: '#2a2a3a',
                    },
                },
            },
        },
    },
});

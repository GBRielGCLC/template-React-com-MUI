import { Box, Typography } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";

export const Home = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
            <HomeIcon sx={{ fontSize: 100, color: 'primary.main' }} />
            <Typography variant="h3" fontWeight="bold">
                Página Inicial
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Este é um exemplo de página para o template base.
            </Typography>
        </Box>
    );
};

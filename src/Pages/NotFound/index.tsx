import { Box, Button, Typography } from "@mui/material";
import { Home, SearchOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <SearchOff sx={{ fontSize: 100, color: 'text.secondary' }} />

      <Typography variant="h3" fontWeight="bold" color="textPrimary">
        Página não encontrada
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
        Esta página não existe ou foi removida.
        Verifique se o endereço está correto.
      </Typography>

      <Button
        variant="contained"
        size="large"
        startIcon={<Home />}
        onClick={() => navigate('/home')}
        sx={{ mt: 2 }}
      >
        Voltar para o início
      </Button>
    </Box>
  );
};

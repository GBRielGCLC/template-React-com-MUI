import { Box, Button, Typography } from "@mui/material";
import { Home, Lock } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export const AccessDenied = () => {
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
      <Lock sx={{ fontSize: 100, color: 'text.secondary' }} />

      <Typography variant="h3" fontWeight="bold" color="textPrimary">
        Acesso negado
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
        Você não tem permissão para acessar esta página.
        Se você acredita que isso é um erro, entre em contato com o administrador.
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

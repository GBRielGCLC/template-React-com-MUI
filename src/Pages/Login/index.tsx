import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    InputAdornment,
    TextField,
    Typography
} from "@mui/material";
import { PersonOutlined, LockOutline, Visibility, VisibilityOff } from "@mui/icons-material";
import { Controller } from "react-hook-form";
import { useLogin } from "./useLogin";
import { ToggleThemeButton } from "../../Components/ToggleThemeButton";
import { BarraColorida } from "../../Components/BarraColorida";

export const Login = () => {
    const {
        control,
        handleSubmit,
        onSubmit,
        errors,
        isLoading,
        showPassword,
        setShowPassword
    } = useLogin();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
            }}
        >
            <ToggleThemeButton sx={{
                position: "absolute",
                top: 16,
                right: 16,
                bgcolor: "background.paper",
                boxShadow: 1
            }} />

            <Card sx={{ width: 380 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            mb: 3
                        }}
                    >
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            TEMPLATE BASE
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: "Informe o nome de usuário" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nome de usuário"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    disabled={isLoading}

                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutlined />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                            )}
                        />

                        <Controller
                            name="password"
                            control={control}
                            rules={{ required: "Informe a senha" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Senha"
                                    type={showPassword ? 'text' : 'password'}
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    disabled={isLoading}

                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutline />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }
                                    }}
                                />
                            )}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                            disabled={isLoading}
                            endIcon={isLoading ? <CircularProgress color="inherit" size={20} /> : undefined}
                        >
                            Entrar
                        </Button>
                    </Box>
                </CardContent>

                <Box mt={2} />

                <BarraColorida />
            </Card>
        </Box>
    );
};

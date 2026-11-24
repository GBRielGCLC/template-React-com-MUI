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
                        <Box
                            component="img"
                            src="/logo.png"
                            alt="Quitta"
                            sx={{ height: 72, mb: 1 }}
                        />
                        <Typography variant="h5" fontWeight="bold" color="primary">
                            Quitta
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Divida, registre e acerte as contas
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="E-mail"
                                    type="email"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
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
            </Card>
        </Box>
    );
};

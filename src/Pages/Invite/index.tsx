import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Check, LockOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import { yup } from '../../Services';
import { useAuth } from '../../Contexts/AuthContext';
import { toApiError } from '../../Services/Api/Errors';

interface IInviteForm {
    password: string;
    confirmPassword: string;
}

/**
 * Regras do backend para `AcceptInviteRequest.password`:
 * 10..128, ≥1 maiúscula, ≥1 minúscula, ≥1 número, ≥1 especial.
 * O yup local não tem mensagens para `matches`, então cada teste leva a sua.
 */
const inviteSchema = yup.object({
    password: yup
        .string()
        .required('Informe a senha')
        .min(10, 'Deve ter pelo menos 10 caracteres')
        .max(128, 'Deve ter no máximo 128 caracteres')
        .matches(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
        .matches(/[a-z]/, 'Inclua ao menos uma letra minúscula')
        .matches(/[0-9]/, 'Inclua ao menos um número')
        .matches(/[^A-Za-z0-9]/, 'Inclua ao menos um caractere especial'),
    confirmPassword: yup
        .string()
        .required('Repita a senha')
        .oneOf([yup.ref('password')], 'As senhas não coincidem'),
});

const PASSWORD_RULES = [
    'Pelo menos 10 caracteres',
    'Ao menos uma letra maiúscula e uma minúscula',
    'Ao menos um número',
    'Ao menos um caractere especial',
];

/** Caixa centralizada usada pelas rotas públicas (padrão da página /join). */
const InviteShell = ({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) => (
    <Box
        sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            bgcolor: 'background.default',
        }}
    >
        <Card sx={{ width: 420 }}>
            <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Box
                        component="img"
                        src="/logo.png"
                        alt="Quitta"
                        sx={{ height: 72, mb: 1 }}
                    />
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                    {children}
                </Box>
            </CardContent>
        </Card>
    </Box>
);

/**
 * Aceite de convite: `/invite?token=<token>` (rota pública, sem login).
 *
 * O token do convite vem do admin (`POST /admin/invites`) e expira em 7 dias.
 * Ao definir a senha, o backend cria a conta e devolve os tokens — a sessão
 * é assumida aqui mesmo (mesmo fluxo do login).
 */
export const Invite = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, user, isLoading, acceptInvite } = useAuth();

    const token = searchParams.get('token');
    const [pageError, setPageError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<IInviteForm>({
        resolver: yupResolver(inviteSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const onSubmit = async (data: IInviteForm) => {
        setPageError(null);
        try {
            await acceptInvite(token!, data.password);
            navigate('/events', { replace: true });
        } catch (err) {
            const apiError = toApiError(err);

            if (apiError.isValidation && apiError.errors) {
                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    const mapped = field === 'password' ? 'password'
                        : field === 'confirmPassword' ? 'confirmPassword'
                        : null;
                    if (mapped) setError(mapped as keyof IInviteForm, { message: messages[0] });
                });
                return;
            }

            if (apiError.code === 'invite.invalid' || apiError.code === 'invite.registration_invalid') {
                setPageError('Este convite não é válido ou expirou. Peça um novo convite ao administrador.');
                return;
            }

            if (apiError.code === 'invite.user_exists') {
                setPageError('Já existe uma conta com este convite. Faça login normalmente.');
                return;
            }

            setPageError(apiError.message);
        }
    };

    const isBusy = isSubmitting || isLoading;

    // Sem token na URL: não há o que validar.
    if (!token) {
        return (
            <InviteShell title="Aceitar convite">
                <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                    Este link de convite está incompleto. Peça um novo convite ao administrador.
                </Alert>
                <Button variant="contained" onClick={() => navigate('/')}>
                    Ir para o início
                </Button>
            </InviteShell>
        );
    }

    return (
        <InviteShell title="Aceitar convite" subtitle="Defina uma senha para criar seu acesso ao Quitta.">
            {isAuthenticated && !isBusy && (
                <Alert severity="info" sx={{ width: '100%', textAlign: 'left' }}>
                    Você está logado como <strong>{user?.name}</strong>. Aceitar este convite cria uma
                    nova conta e <strong>substitui sua sessão atual</strong>.
                    <Box sx={{ mt: 1 }}>
                        <Button size="small" onClick={() => navigate('/events')}>
                            Continuar como estou
                        </Button>
                    </Box>
                </Alert>
            )}

            {pageError && (
                <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                    {pageError}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Nova senha"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            error={!!errors.password}
                            helperText={errors.password?.message}
                            disabled={isBusy}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockOutline />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword((v) => !v)}
                                                edge="end"
                                                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    )}
                />

                <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Confirmar senha"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            sx={{ mt: 2 }}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
                            disabled={isBusy}
                        />
                    )}
                />

                <List dense sx={{ mt: 0.5, mb: 2, py: 0 }}>
                    {PASSWORD_RULES.map((rule) => (
                        <ListItem key={rule} sx={{ py: 0, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                <Check color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={rule}
                                primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                            />
                        </ListItem>
                    ))}
                </List>

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isBusy}
                    endIcon={isBusy ? <CircularProgress color="inherit" size={20} /> : undefined}
                >
                    Criar acesso
                </Button>
            </Box>
        </InviteShell>
    );
};

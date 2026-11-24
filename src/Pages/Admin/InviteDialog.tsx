import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { yup } from '../../Services';
import { AuthService } from '../../Services/Api/Auth/AuthService';
import { InviteDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';
import { formatarDataHoraTela } from '../../Services/Formatters';

interface IInviteForm {
    email: string;
    displayName: string;
}

const inviteSchema = yup.object({
    email: yup
        .string()
        .required('Informe o e-mail')
        .max(256, 'O e-mail pode ter no máximo 256 caracteres')
        .email('Deve ser um e-mail válido'),
    displayName: yup
        .string()
        .required('Informe o nome')
        .max(120, 'O nome pode ter no máximo 120 caracteres'),
});

interface InviteDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Cria um convite de acesso (`POST /admin/invites`).
 *
 * Não há e-mail no MVP: o `token` é devolvido **uma única vez** e o admin
 * compartilha a URL `/invite?token=...` manualmente. O token expira em 7 dias.
 * Erros comuns: `409 invite.user_exists`, `409 invite.already_pending`,
 * `422 invite.invalid_email`.
 */
export const InviteDialog = ({ open, onClose }: InviteDialogProps) => {
    /** Convite criado nesta sessão — o token não pode ser recuperado depois. */
    const [created, setCreated] = useState<InviteDto | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setError: setFieldError,
        formState: { errors, isSubmitting },
    } = useForm<IInviteForm>({
        resolver: yupResolver(inviteSchema),
        defaultValues: { email: '', displayName: '' },
    });

    useEffect(() => {
        if (open) {
            reset({ email: '', displayName: '' });
            setCreated(null);
        }
    }, [open, reset]);

    const inviteUrl = created
        ? `${window.location.origin}/invite?token=${encodeURIComponent(created.token)}`
        : null;

    const onSubmit = async (data: IInviteForm) => {
        try {
            const invite = await AuthService.CreateInvite({
                email: data.email.trim(),
                displayName: data.displayName.trim(),
            });
            setCreated(invite);
            toastManager.success('Convite criado com sucesso!');
        } catch (err) {
            const apiError = toApiError(err);

            if (apiError.code === 'invite.user_exists'
                || apiError.code === 'invite.already_pending'
                || apiError.code === 'invite.invalid_email') {
                setFieldError('email', { message: apiError.message });
                return;
            }

            if (apiError.isValidation && apiError.errors) {
                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    const mapped = field === 'email' ? 'email'
                        : field === 'displayName' ? 'displayName'
                        : null;
                    if (mapped) setFieldError(mapped as keyof IInviteForm, { message: messages[0] });
                });
                return;
            }

            // 403 auth.forbidden etc.
            toastManager.error(apiError.message);
        }
    };

    const handleCopy = () => {
        if (!inviteUrl) return;
        navigator.clipboard.writeText(inviteUrl)
            .then(() => toastManager.success('Link de convite copiado!'))
            .catch(() => toastManager.error('Não foi possível copiar.'));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{created ? 'Convite criado' : 'Novo convite'}</DialogTitle>

            <DialogContent>
                {created && inviteUrl ? (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Alert severity="warning" variant="outlined">
                            <strong>Guarde este link agora.</strong> Por segurança, o token do convite
                            não poderá ser consultado novamente — se for perdido, será preciso criar
                            um novo convite (invalidando este). Ele expira em {formatarDataHoraTela(created.expiresAt)}.
                        </Alert>

                        <Typography variant="body2" color="text.secondary">
                            Envie este endereço para <strong>{created.email}</strong>. Ao abri-lo, a pessoa
                            define a senha e já entra no Quitta.
                        </Typography>

                        <TextField
                            value={inviteUrl}
                            fullWidth
                            size="small"
                            onFocus={(e) => e.currentTarget.select()}
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={handleCopy} edge="end">
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Stack>
                ) : (
                    <Box component="form" onSubmit={handleSubmit(onSubmit)} id="invite-form">
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Alert severity="info" variant="outlined">
                                Sem envio de e-mail no momento: o link do convite é gerado aqui e
                                compartilhado manualmente. A conta é criada no primeiro acesso.
                            </Alert>

                            <Controller
                                name="displayName"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Nome"
                                        fullWidth
                                        autoFocus
                                        error={!!errors.displayName}
                                        helperText={errors.displayName?.message}
                                        disabled={isSubmitting}
                                        inputProps={{ maxLength: 120 }}
                                    />
                                )}
                            />

                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="E-mail"
                                        type="email"
                                        fullWidth
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                        disabled={isSubmitting}
                                        inputProps={{ maxLength: 256 }}
                                    />
                                )}
                            />
                        </Stack>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                {created ? (
                    <>
                        <Button onClick={handleCopy} variant="outlined" startIcon={<ContentCopy />}>
                            Copiar link
                        </Button>
                        <Button onClick={onClose} variant="contained">
                            Concluir
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={onClose} disabled={isSubmitting} color="secondary">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="invite-form"
                            variant="contained"
                            disabled={isSubmitting}
                        >
                            Criar convite
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

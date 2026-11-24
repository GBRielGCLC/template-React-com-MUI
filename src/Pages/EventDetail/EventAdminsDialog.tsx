import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, PersonRemove } from '@mui/icons-material';
import { yup } from '../../Services';
import { EventsService } from '../../Services/Api/Events/EventsService';
import { EventAdminDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';
import { formatarDataHoraTela } from '../../Services/Formatters';
import { useConfirm } from '../../Contexts/ConfirmDialogContext';

interface IAdminForm {
    email: string;
}

const adminSchema = yup.object({
    email: yup
        .string()
        .required('Informe o e-mail')
        .max(256, 'O e-mail pode ter no máximo 256 caracteres')
        .email('Deve ser um e-mail válido'),
});

interface EventAdminsDialogProps {
    open: boolean;
    eventId: string;
    onClose: () => void;
}

/**
 * Gestão de administradores do evento (`GET/POST/DELETE /events/{id}/admins`).
 *
 * A lista não é paginada. O usuário adicionado precisa **já existir** no
 * Quitta (`422 event.admin.user_not_found`) — sem cadastro por e-mail aqui.
 * O proprietário não pode ser removido (`422 event.admin.owner_immutable`).
 */
export const EventAdminsDialog = ({ open, eventId, onClose }: EventAdminsDialogProps) => {
    const confirm = useConfirm();

    const [admins, setAdmins] = useState<EventAdminDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setError: setFieldError,
        formState: { errors, isSubmitting },
    } = useForm<IAdminForm>({
        resolver: yupResolver(adminSchema),
        defaultValues: { email: '' },
    });

    const load = useCallback(() => {
        setLoading(true);
        EventsService.ListAdmins(eventId)
            .then((result) => {
                setAdmins(result);
                setError(null);
            })
            .catch((err) => {
                const apiError = toApiError(err);
                console.error('Erro ao carregar administradores:', apiError);
                setAdmins([]);
                setError(apiError.message);
            })
            .finally(() => setLoading(false));
    }, [eventId]);

    useEffect(() => {
        if (!open) return;
        reset({ email: '' });
        load();
    }, [open, load, reset]);

    const onSubmit = async (data: IAdminForm) => {
        try {
            await EventsService.AddAdmin(eventId, data.email.trim());
            toastManager.success('Administrador adicionado!');
            reset({ email: '' });
            load();
        } catch (err) {
            const apiError = toApiError(err);

            // Usuário inexistente/convite: mostra no campo de e-mail.
            if (apiError.code === 'event.admin.user_not_found'
                || apiError.code === 'event.admin.already_exists') {
                setFieldError('email', { message: apiError.message });
                return;
            }

            if (apiError.isValidation && apiError.errors) {
                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    if (field === 'email') setFieldError('email', { message: messages[0] });
                });
                return;
            }

            // 403 event.admin_required, 409 event.closed etc.
            toastManager.error(apiError.message);
        }
    };

    const handleRemove = useCallback((admin: EventAdminDto) => {
        confirm({
            titulo: 'Remover administrador',
            conteudo: `Remover "${admin.displayName}" (${admin.email}) da lista de administradores deste evento?`,
            textBtnConfirmar: 'Remover',
            corBtnConfirmar: 'error',
            onConfirm: async ({ close, setLoading: setDlgLoading }) => {
                setDlgLoading(true);
                try {
                    await EventsService.RemoveAdmin(eventId, admin.userId);
                    toastManager.success('Administrador removido.');
                    load();
                } catch (err) {
                    // 404 event.admin.not_found, 422 event.admin.owner_immutable
                    toastManager.error(toApiError(err).message);
                } finally {
                    close();
                }
            },
        });
    }, [confirm, eventId, load]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Administradores do evento</DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Alert severity="info" variant="outlined">
                        Administradores podem editar o evento, participantes, despesas e confirmar
                        pagamentos. O usuário precisa <strong>já ter uma conta</strong> no Quitta.
                    </Alert>

                    {/* Formulário de adição */}
                    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="E-mail do usuário"
                                        type="email"
                                        fullWidth
                                        size="small"
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                        disabled={isSubmitting}
                                        inputProps={{ maxLength: 256 }}
                                    />
                                )}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Add />}
                                disabled={isSubmitting}
                                sx={{ height: 40, flexShrink: 0 }}
                            >
                                Adicionar
                            </Button>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Lista */}
                    {loading ? (
                        <Stack spacing={1}>
                            <Skeleton variant="rounded" height={56} />
                            <Skeleton variant="rounded" height={56} />
                        </Stack>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : admins.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Nenhum administrador encontrado.
                        </Typography>
                    ) : (
                        <List disablePadding>
                            {admins.map((admin, index) => (
                                <ListItem
                                    key={admin.userId}
                                    divider={index < admins.length - 1}
                                    secondaryAction={
                                        admin.isOwner ? null : (
                                            <Tooltip title="Remover administrador">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    aria-label="Remover administrador"
                                                    onClick={() => handleRemove(admin)}
                                                >
                                                    <PersonRemove fontSize="small" color="error" />
                                                </IconButton>
                                            </Tooltip>
                                        )
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {admin.displayName}
                                                </Typography>
                                                {admin.isOwner && (
                                                    <Chip label="Proprietário" color="primary" size="small" />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="text.secondary">
                                                {admin.email} · desde {formatarDataHoraTela(admin.grantedAt)}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color="secondary">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

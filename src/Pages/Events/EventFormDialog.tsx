import { useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
    TextField,
    FormControlLabel,
    Switch,
    Stack,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { yup } from '../../Services';
import { EventsService } from '../../Services/Api/Events/EventsService';
import { EventDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';

interface IEventForm {
    name: string;
    description: string;
    requirePaymentConfirmation: boolean;
}

const eventSchema = yup.object({
    name: yup
        .string()
        .required('Informe o nome do evento')
        .max(120, 'O nome pode ter no máximo 120 caracteres'),
    description: yup
        .string()
        .defined()
        .max(2000, 'A descrição pode ter no máximo 2000 caracteres'),
    requirePaymentConfirmation: yup.boolean().defined(),
});

interface EventFormDialogProps {
    open: boolean;
    /** Presente = editar; ausente = criar. */
    event?: EventDto | null;
    onClose: () => void;
    /** Chamado após sucesso, com o evento criado/atualizado. */
    onSaved: (event: EventDto) => void;
}

export const EventFormDialog = ({ open, event, onClose, onSaved }: EventFormDialogProps) => {
    const isEdit = !!event;

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<IEventForm>({
        resolver: yupResolver(eventSchema),
        defaultValues: {
            name: '',
            description: '',
            requirePaymentConfirmation: true,
        },
    });

    // Preenche ao abrir (editar) ou reseta para os defaults (criar).
    useEffect(() => {
        if (!open) return;
        reset({
            name: event?.name ?? '',
            description: event?.description ?? '',
            requirePaymentConfirmation: event?.requirePaymentConfirmation ?? true,
        });
    }, [open, event, reset]);

    const onSubmit = async (data: IEventForm) => {
        try {
            const payload = {
                name: data.name.trim(),
                description: data.description.trim() || null,
                requirePaymentConfirmation: data.requirePaymentConfirmation,
            };

            const saved = isEdit
                ? await EventsService.Update(event!.id, payload)
                : await EventsService.Create(payload);

            toastManager.success(isEdit ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
            onSaved(saved);
        } catch (error) {
            const apiError = toApiError(error);

            // Erros por campo (validation.failed) vão para o campo correspondente.
            if (apiError.isValidation && apiError.errors) {
                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    const mapped = field === 'name' ? 'name'
                        : field === 'description' ? 'description'
                        : field === 'requirePaymentConfirmation' ? 'requirePaymentConfirmation'
                        : null;
                    if (mapped) {
                        setError(mapped as keyof IEventForm, { message: messages[0] });
                    }
                });
                return;
            }

            // Demais códigos (409, 422...) mostram o detail pt-BR da API.
            toastManager.error(apiError.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? 'Editar evento' : 'Novo evento'}</DialogTitle>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nome do evento"
                                    fullWidth
                                    autoFocus
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    disabled={isSubmitting}
                                    inputProps={{ maxLength: 120 }}
                                />
                            )}
                        />

                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Descrição (opcional)"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    error={!!errors.description}
                                    helperText={errors.description?.message}
                                    disabled={isSubmitting}
                                    inputProps={{ maxLength: 2000 }}
                                />
                            )}
                        />

                        <Controller
                            name="requirePaymentConfirmation"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            disabled={isSubmitting}
                                        />
                                    }
                                    label="Exigir confirmação de pagamentos"
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={isSubmitting} color="secondary">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        endIcon={isSubmitting ? <CircularProgress color="inherit" size={20} /> : undefined}
                    >
                        {isEdit ? 'Salvar' : 'Criar'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

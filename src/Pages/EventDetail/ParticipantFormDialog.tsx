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
    Stack,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { yup } from '../../Services';
import { ParticipantsService } from '../../Services/Api/Participants/ParticipantsService';
import { ParticipantCreatedDto, ParticipantDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';

interface IParticipantForm {
    name: string;
    pixKey: string;
}

const participantSchema = yup.object({
    name: yup
        .string()
        .defined()
        .required('Informe o nome do participante')
        .max(120, 'O nome pode ter no máximo 120 caracteres'),
    pixKey: yup
        .string()
        .defined()
        .max(140, 'A chave Pix pode ter no máximo 140 caracteres'),
});

interface ParticipantFormDialogProps {
    open: boolean;
    eventId: string;
    /** Presente = editar; ausente = criar. */
    participant?: ParticipantDto | null;
    onClose: () => void;
    /**
     * Chamado após sucesso. Na criação, recebe o `ParticipantCreatedDto`
     * com o `accessToken` (exibido uma única vez); na edição, `undefined`.
     */
    onSaved: (created?: ParticipantCreatedDto) => void;
}

export const ParticipantFormDialog = ({
    open,
    eventId,
    participant,
    onClose,
    onSaved,
}: ParticipantFormDialogProps) => {
    const isEdit = !!participant;

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<IParticipantForm>({
        resolver: yupResolver(participantSchema),
        defaultValues: { name: '', pixKey: '' },
    });

    useEffect(() => {
        if (!open) return;
        reset({
            name: participant?.name ?? '',
            pixKey: participant?.pixKey ?? '',
        });
    }, [open, participant, reset]);

    const onSubmit = async (data: IParticipantForm) => {
        try {
            const name = data.name.trim();
            const pixKey = data.pixKey.trim();

            if (isEdit) {
                const payload: { name: string; pixKey?: string | null; clearPixKey?: boolean } = { name };
                // Só envia a Pix se houve mudança (PATCH é parcial).
                if (pixKey !== (participant?.pixKey ?? '')) {
                    if (pixKey) {
                        payload.pixKey = pixKey;
                    } else {
                        payload.clearPixKey = true;
                    }
                }

                await ParticipantsService.Update(eventId, participant!.id, payload);
                toastManager.success('Participante atualizado!');
                onSaved();
            } else {
                const created = await ParticipantsService.Create(eventId, {
                    name,
                    pixKey: pixKey || null,
                });
                toastManager.success('Participante adicionado!');
                onSaved(created);
            }
        } catch (error) {
            const apiError = toApiError(error);

            if (apiError.isValidation && apiError.errors) {
                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    if (field === 'name') setError('name', { message: messages[0] });
                    if (field === 'pixKey') setError('pixKey', { message: messages[0] });
                });
                return;
            }

            toastManager.error(apiError.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? 'Editar participante' : 'Novo participante'}</DialogTitle>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Nome"
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
                            name="pixKey"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Chave Pix (opcional)"
                                    fullWidth
                                    error={!!errors.pixKey}
                                    helperText={
                                        errors.pixKey?.message
                                        ?? 'E-mail, telefone, CPF/CNPJ ou chave aleatória. Usada nos acertos de saldo.'
                                    }
                                    disabled={isSubmitting}
                                    inputProps={{ maxLength: 140 }}
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
                        {isEdit ? 'Salvar' : 'Adicionar'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

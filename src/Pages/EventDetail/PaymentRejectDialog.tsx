import { useEffect } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { yup } from '../../Services';
import { PaymentsService } from '../../Services/Api/Payments/PaymentsService';
import { PaymentDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';
import { formatarMoeda } from '../../Services/Formatters';

interface IRejectForm {
    reason: string;
}

const rejectSchema = yup.object({
    reason: yup
        .string()
        .defined()
        .trim()
        .required('Informe o motivo da recusa')
        .min(1, 'Informe o motivo da recusa')
        .max(500, 'O motivo pode ter no máximo 500 caracteres'),
});

interface PaymentRejectDialogProps {
    open: boolean;
    eventId: string;
    payment: PaymentDto | null;
    onClose: () => void;
    onSaved: () => void;
}

/** `POST /payments/{id}/reject` — o motivo (1..500) é obrigatório. */
export const PaymentRejectDialog = ({ open, eventId, payment, onClose, onSaved }: PaymentRejectDialogProps) => {
    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<IRejectForm>({
        resolver: yupResolver(rejectSchema),
        defaultValues: { reason: '' },
    });

    useEffect(() => {
        if (open) reset({ reason: '' });
    }, [open, reset]);

    const onSubmit = async (data: IRejectForm) => {
        if (!payment) return;

        try {
            await PaymentsService.Reject(eventId, payment.id, { reason: data.reason.trim() });
            toastManager.success('Pagamento recusado.');
            onSaved();
        } catch (error) {
            const apiError = toApiError(error);

            if (apiError.isValidation && apiError.errors?.reason) {
                setError('reason', { message: apiError.errors.reason[0] });
                return;
            }

            // 409 payment.not_informed etc.
            toastManager.error(apiError.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Recusar pagamento</DialogTitle>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {payment && (
                            <Alert severity="warning" variant="outlined">
                                Recusar o pagamento de <strong>{formatarMoeda(payment.amountCents / 100)}</strong>{' '}
                                de {payment.from.name} para {payment.to.name}. O motivo fica visível para
                                os participantes do evento.
                            </Alert>
                        )}

                        <Controller
                            name="reason"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Motivo da recusa"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    autoFocus
                                    error={!!errors.reason}
                                    helperText={errors.reason?.message}
                                    disabled={isSubmitting}
                                    inputProps={{ maxLength: 500 }}
                                />
                            )}
                        />

                        <Typography variant="caption" color="text.secondary">
                            O pagamento informado poderá ser registrado novamente com os dados corretos.
                        </Typography>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={isSubmitting} color="secondary">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        disabled={isSubmitting}
                        endIcon={isSubmitting ? <CircularProgress color="inherit" size={20} /> : undefined}
                    >
                        Recusar
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

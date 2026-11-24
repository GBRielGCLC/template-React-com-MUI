import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { yup } from '../../Services';
import { MoneyTextField } from '../../Components/MoneyTextField';
import { ParticipantsService } from '../../Services/Api/Participants/ParticipantsService';
import { PaymentsService } from '../../Services/Api/Payments/PaymentsService';
import { CreatePaymentRequest, ParticipantDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';

interface IPaymentForm {
    fromParticipantId: string;
    toParticipantId: string;
    amount: number | null;
    note: string;
}

const paymentSchema = yup.object({
    fromParticipantId: yup.string().defined().required('Informe quem pagou'),
    toParticipantId: yup.string().defined().required('Informe quem recebeu'),
    amount: yup
        .number()
        .typeError('Informe o valor do pagamento')
        .defined()
        .nullable()
        .test('is-positive', 'O valor deve ser maior que zero', (value) => typeof value === 'number' && value > 0),
    note: yup
        .string()
        .defined()
        .max(500, 'A observação pode ter no máximo 500 caracteres'),
});

interface PaymentFormDialogProps {
    open: boolean;
    eventId: string;
    /** Sessão de participante: trava o "De" nele mesmo (`403 payment.self_only`). */
    lockedFromParticipantId?: string | null;
    onClose: () => void;
    onSaved: () => void;
}

export const PaymentFormDialog = ({ open, eventId, lockedFromParticipantId, onClose, onSaved }: PaymentFormDialogProps) => {
    const [participants, setParticipants] = useState<ParticipantDto[]>([]);
    const [loading, setLoading] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<IPaymentForm>({
        resolver: yupResolver(paymentSchema),
        defaultValues: {
            fromParticipantId: '',
            toParticipantId: '',
            amount: null,
            note: '',
        },
    });

    const fromId = watch('fromParticipantId');

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoading(true);

        ParticipantsService.List(eventId, { pageSize: 100, sort: 'name' })
            .then((result) => {
                if (!cancelled) setParticipants(result.items.filter((p) => p.isActive));
            })
            .catch((error) => {
                if (!cancelled) console.error('Erro ao carregar participantes:', toApiError(error));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        reset({
            fromParticipantId: lockedFromParticipantId ?? '',
            toParticipantId: '',
            amount: null,
            note: '',
        });
        return () => {
            cancelled = true;
        };
    }, [open, eventId, reset, lockedFromParticipantId]);

    const onSubmit = async (data: IPaymentForm) => {
        if (data.fromParticipantId === data.toParticipantId) {
            setError('toParticipantId', { message: 'O destinatário deve ser diferente do pagador.' });
            return;
        }

        try {
            const payload: CreatePaymentRequest = {
                fromParticipantId: data.fromParticipantId,
                toParticipantId: data.toParticipantId,
                amountCents: Math.round((data.amount ?? 0) * 100),
                note: data.note.trim() || null,
            };

            await PaymentsService.Create(eventId, payload);
            toastManager.success('Pagamento informado! Aguardando confirmação do administrador.');
            onSaved();
        } catch (error) {
            const apiError = toApiError(error);

            if (apiError.isValidation && apiError.errors) {
                const fieldMap: Record<string, keyof IPaymentForm> = {
                    fromParticipantId: 'fromParticipantId',
                    toParticipantId: 'toParticipantId',
                    amountCents: 'amount',
                    note: 'note',
                };
                let mapped = false;

                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    const formField = fieldMap[field];
                    if (formField) {
                        setError(formField, { message: messages[0] });
                        mapped = true;
                    }
                });
                if (mapped) return;
            }

            toastManager.error(apiError.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Informar pagamento</DialogTitle>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Alert severity="info" variant="outlined">
                            O pagamento nasce como <strong>aguardando confirmação</strong> (se o evento exigir)
                            e só altera o saldo depois de confirmado por um administrador.
                        </Alert>

                        {lockedFromParticipantId && (
                            <Alert severity="info" variant="outlined">
                                Como participante, você só pode informar pagamentos em que <strong>você</strong> pagou.
                            </Alert>
                        )}

                        <Controller
                            name="fromParticipantId"
                            control={control}
                            render={({ field }) => (
                                <FormControl
                                    error={!!errors.fromParticipantId}
                                    disabled={isSubmitting || loading || !!lockedFromParticipantId}
                                    fullWidth
                                >
                                    <InputLabel id="payment-from-label">De (quem pagou)</InputLabel>
                                    <Select
                                        {...field}
                                        labelId="payment-from-label"
                                        label="De (quem pagou)"
                                    >
                                        {participants.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="toParticipantId"
                            control={control}
                            render={({ field }) => (
                                <FormControl
                                    error={!!errors.toParticipantId}
                                    disabled={isSubmitting || loading}
                                    fullWidth
                                >
                                    <InputLabel id="payment-to-label">Para (quem recebeu)</InputLabel>
                                    <Select
                                        {...field}
                                        labelId="payment-to-label"
                                        label="Para (quem recebeu)"
                                    >
                                        {participants
                                            .filter((p) => p.id !== fromId)
                                            .map((p) => (
                                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <Controller
                            name="amount"
                            control={control}
                            render={({ field }) => (
                                <MoneyTextField
                                    {...field}
                                    label="Valor"
                                    value={field.value ?? null}
                                    onChange={field.onChange}
                                    error={!!errors.amount}
                                    helperText={errors.amount?.message}
                                    disabled={isSubmitting}
                                    fullWidth
                                />
                            )}
                        />

                        <Controller
                            name="note"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Observação (opcional)"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    error={!!errors.note}
                                    helperText={errors.note?.message}
                                    disabled={isSubmitting}
                                    inputProps={{ maxLength: 500 }}
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
                        disabled={isSubmitting || loading}
                        endIcon={isSubmitting ? <CircularProgress color="inherit" size={20} /> : undefined}
                    >
                        Informar
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

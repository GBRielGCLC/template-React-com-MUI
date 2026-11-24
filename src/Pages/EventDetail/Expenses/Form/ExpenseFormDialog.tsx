import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormHelperText,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { MoneyTextField } from '../../../../Components/MoneyTextField';
import { ExpenseDto } from '../../../../Services/Api/Types';
import { SplitParticipantsList } from './Components/SplitParticipantsList';
import { SplitTypeSelector } from './Components/SplitTypeSelector';
import { useExpenseForm } from './useExpenseForm';

interface ExpenseFormDialogProps {
    open: boolean;
    eventId: string;
    /** Presente = editar; ausente = criar. */
    expense?: ExpenseDto | null;
    onClose: () => void;
    onSaved: () => void;
}

export const ExpenseFormDialog = ({ open, eventId, expense, onClose, onSaved }: ExpenseFormDialogProps) => {
    const {
        isEdit,
        control,
        errors,
        isSubmitting,
        participantsLoading,
        noParticipants,
        visibleParticipants,
        hiddenInactiveCount,
        showInactive,
        splitType,
        selectedIds,
        amounts,
        percentages,
        previewCentsById,
        missingFixedCents,
        missingPercentageBp,
        splitError,
        sumSummary,
        setSplitError,
        setShowInactive,
        handleSplitTypeChange,
        toggleSelected,
        toggleSelectAllVisible,
        handleAmountChange,
        handlePercentageChange,
        handleCompleteRemaining,
        submitForm,
    } = useExpenseForm({ open, eventId, expense, onSaved });

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="body">
            <DialogTitle>{isEdit ? 'Editar despesa' : 'Nova despesa'}</DialogTitle>

            <Box component="form" onSubmit={submitForm}>
                <DialogContent>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        {noParticipants && (
                            <Grid size={{ xs: 12 }}>
                                <Alert severity="info">
                                    Adicione participantes ao evento (aba Participantes) antes de registrar despesas.
                                </Alert>
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Descrição"
                                        required
                                        fullWidth
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                        disabled={isSubmitting}
                                        inputProps={{ maxLength: 200 }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="totalAmount"
                                control={control}
                                render={({ field }) => (
                                    <MoneyTextField
                                        {...field}
                                        label="Valor total"
                                        required
                                        fullWidth
                                        value={field.value ?? null}
                                        onChange={field.onChange}
                                        error={!!errors.totalAmount}
                                        helperText={errors.totalAmount?.message}
                                        disabled={isSubmitting}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => {
                                    const parsed = field.value ? dayjs(field.value) : null;
                                    return (
                                        <DatePicker
                                            label="Data"
                                            value={parsed?.isValid() ? parsed : null}
                                            onChange={(newValue) =>
                                                field.onChange(newValue ? newValue.format('YYYY-MM-DD') : '')
                                            }
                                            format="DD/MM/YYYY"
                                            disabled={isSubmitting}
                                            slotProps={{
                                                field: { clearable: true },
                                                textField: {
                                                    fullWidth: true,
                                                    error: !!errors.date,
                                                    helperText: errors.date?.message,
                                                },
                                            }}
                                        />
                                    );
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="paidByParticipantId"
                                control={control}
                                render={({ field }) => (
                                    <FormControl
                                        fullWidth
                                        required
                                        error={!!errors.paidByParticipantId}
                                        disabled={isSubmitting || participantsLoading}
                                    >
                                        <InputLabel id="paid-by-label">Pago por</InputLabel>
                                        <Select
                                            {...field}
                                            labelId="paid-by-label"
                                            label="Pago por"
                                        >
                                            {visibleParticipants.map((p) => (
                                                <MenuItem key={p.id} value={p.id} disabled={!p.active}>
                                                    {p.name}
                                                    {!p.active && ' (inativo)'}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.paidByParticipantId && (
                                            <FormHelperText>{errors.paidByParticipantId.message}</FormHelperText>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Observações (opcional)"
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        error={!!errors.notes}
                                        helperText={errors.notes?.message}
                                        disabled={isSubmitting}
                                        inputProps={{ maxLength: 2000 }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 0.5 }} />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                                Como dividir
                            </Typography>

                            <SplitTypeSelector
                                value={splitType}
                                disabled={isSubmitting}
                                onChange={handleSplitTypeChange}
                            />

                            <SplitParticipantsList
                                participants={visibleParticipants}
                                selectedIds={selectedIds}
                                splitType={splitType}
                                amounts={amounts}
                                percentages={percentages}
                                previewCentsById={previewCentsById}
                                missingFixedCents={missingFixedCents}
                                missingPercentageBp={missingPercentageBp}
                                loading={participantsLoading}
                                disabled={isSubmitting}
                                hiddenInactiveCount={hiddenInactiveCount}
                                showInactive={showInactive}
                                sumSummary={sumSummary}
                                splitError={splitError}
                                onToggleShowInactive={setShowInactive}
                                onToggleSelectAll={toggleSelectAllVisible}
                                onToggleParticipant={toggleSelected}
                                onAmountChange={handleAmountChange}
                                onPercentageChange={handlePercentageChange}
                                onCompleteRemaining={handleCompleteRemaining}
                                onClearSplitError={() => setSplitError(null)}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={onClose} disabled={isSubmitting} color="secondary">
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting || noParticipants}
                        endIcon={isSubmitting ? <CircularProgress color="inherit" size={20} /> : undefined}
                    >
                        {isEdit ? 'Salvar' : 'Registrar'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
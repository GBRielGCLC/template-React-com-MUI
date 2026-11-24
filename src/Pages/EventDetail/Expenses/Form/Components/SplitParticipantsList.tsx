import { Alert, Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { SplitType } from '../../../../../Services/Api/Types';
import { SplitParticipantRow } from './SplitParticipantRow';
import { SplitParticipant } from '../useExpenseForm';

interface SplitParticipantsListProps {
    participants: SplitParticipant[];
    selectedIds: string[];
    splitType: SplitType;
    amounts: Record<string, number | null>;
    percentages: Record<string, number | null>;
    previewCentsById: Record<string, number>;
    missingFixedCents: number;
    missingPercentageBp: number;
    loading: boolean;
    disabled?: boolean;
    hiddenInactiveCount: number;
    showInactive: boolean;
    sumSummary: { text: string; color: 'success.main' | 'error.main' | 'text.secondary' };
    splitError: string | null;
    onToggleShowInactive: (show: boolean) => void;
    onToggleSelectAll: () => void;
    onToggleParticipant: (id: string) => void;
    onAmountChange: (id: string, value: number | null) => void;
    onPercentageChange: (id: string, value: number | null) => void;
    onCompleteRemaining: (id: string) => void;
    onClearSplitError: () => void;
}

export const SplitParticipantsList = ({
    participants,
    selectedIds,
    splitType,
    amounts,
    percentages,
    previewCentsById,
    missingFixedCents,
    missingPercentageBp,
    loading,
    disabled,
    hiddenInactiveCount,
    showInactive,
    sumSummary,
    splitError,
    onToggleShowInactive,
    onToggleSelectAll,
    onToggleParticipant,
    onAmountChange,
    onPercentageChange,
    onCompleteRemaining,
    onClearSplitError,
}: SplitParticipantsListProps) => {
    const allVisibleSelected =
        participants.length > 0 && participants.every((p) => selectedIds.includes(p.id));

    return (
        <>
            {/* Cabeçalho */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
            >
                <Typography variant="body2" color="text.secondary">
                    Participantes ({selectedIds.length} selecionado{selectedIds.length === 1 ? '' : 's'})
                </Typography>

                {participants.length > 1 && (
                    <Button
                        size="small"
                        onClick={onToggleSelectAll}
                        disabled={disabled}
                        sx={{ textTransform: 'none', py: 0 }}
                    >
                        {allVisibleSelected ? 'Desmarcar todos' : 'Marcar todos'}
                    </Button>
                )}
            </Stack>

            {/* Corpo da Lista */}
            {loading ? (
                <Stack direction="row" alignItems="center" gap={1} sx={{ py: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                        Carregando participantes...
                    </Typography>
                </Stack>
            ) : (
                <Box
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        maxHeight: 290,
                        overflowY: 'auto',
                    }}
                >
                    <Stack divider={<Divider />}>
                        {participants.map((participant) => {
                            const selected = selectedIds.includes(participant.id);
                            const canComplete =
                                selected
                                && ((splitType === 'fixed' && missingFixedCents > 0)
                                    || (splitType === 'percentage' && missingPercentageBp > 0));

                            return (
                                <SplitParticipantRow
                                    key={participant.id}
                                    participant={participant}
                                    selected={selected}
                                    splitType={splitType}
                                    amount={amounts[participant.id] ?? null}
                                    percentage={percentages[participant.id] ?? null}
                                    previewCents={previewCentsById[participant.id] ?? 0}
                                    canComplete={canComplete}
                                    disabled={disabled}
                                    onToggle={onToggleParticipant}
                                    onAmountChange={onAmountChange}
                                    onPercentageChange={onPercentageChange}
                                    onCompleteRemaining={onCompleteRemaining}
                                />
                            );
                        })}
                    </Stack>
                </Box>
            )}

            {/* Rodapé: Resumo + Toggle Inativos */}
            <Box
                sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <Typography variant="caption" color={sumSummary.color}>
                    {sumSummary.text}
                </Typography>

                {hiddenInactiveCount > 0 && (
                    <Button
                        size="small"
                        color="inherit"
                        onClick={() => onToggleShowInactive(true)}
                        sx={{ textTransform: 'none', py: 0, fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                        Mostrar {hiddenInactiveCount} inativo{hiddenInactiveCount === 1 ? '' : 's'}
                    </Button>
                )}

                {showInactive && (
                    <Button
                        size="small"
                        color="inherit"
                        onClick={() => onToggleShowInactive(false)}
                        sx={{ textTransform: 'none', py: 0, fontSize: '0.75rem', color: 'text.secondary' }}
                    >
                        Ocultar inativos
                    </Button>
                )}
            </Box>

            {splitError && (
                <Alert severity="error" sx={{ mt: 1.5 }} onClose={onClearSplitError}>
                    {splitError}
                </Alert>
            )}
        </>
    );
};
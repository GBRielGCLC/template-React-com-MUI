import { Box, Button, Checkbox, Chip, Stack, TextField, Typography, alpha } from '@mui/material';
import { AutoFixHighOutlined } from '@mui/icons-material';
import { MoneyTextField } from '../../../../../Components/MoneyTextField';
import { SplitType } from '../../../../../Services/Api/Types';
import { formatarMoeda } from '../../../../../Services/Formatters';
import { SplitParticipant } from '../useExpenseForm';
import NumericTextField from '../../../../../Components/NumericTextField';

interface SplitParticipantRowProps {
    participant: SplitParticipant;
    selected: boolean;
    splitType: SplitType;
    amount: number | null;
    percentage: number | null;
    previewCents: number;
    canComplete: boolean;
    disabled?: boolean;
    onToggle: (id: string) => void;
    onAmountChange: (id: string, value: number | null) => void;
    onPercentageChange: (id: string, value: number | null) => void;
    onCompleteRemaining: (id: string) => void;
}

export const SplitParticipantRow = ({
    participant,
    selected,
    splitType,
    amount,
    percentage,
    previewCents,
    canComplete,
    disabled,
    onToggle,
    onAmountChange,
    onPercentageChange,
    onCompleteRemaining,
}: SplitParticipantRowProps) => {
    const isRemainder = splitType === 'remaining' && selected && amount === null;

    return (
        <Box
            onClick={() => {
                if (splitType === 'equal') onToggle(participant.id);
            }}
            sx={(theme) => ({
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                gap: 1.5,
                px: 1.5,
                py: 1,
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                cursor: splitType === 'equal' ? 'pointer' : 'default',
                transition: 'background-color 0.15s',
                '&:hover': {
                    bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'action.hover',
                },
            })}
        >
            {/* Lado Esquerdo: Checkbox + Nome + Badges */}
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(participant.id);
                }}
                sx={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
            >
                <Checkbox size="small" checked={selected} disableRipple sx={{ p: 0.5 }} />

                <Typography
                    variant="body2"
                    fontWeight={selected ? 600 : 400}
                    color={selected ? 'text.primary' : 'text.secondary'}
                    noWrap
                >
                    {participant.name}
                </Typography>

                {!participant.active && (
                    <Chip label="Inativo" size="small" color="warning" variant="outlined" />
                )}

                {selected && splitType === 'remaining' && isRemainder && (
                    <Chip label="Restante" size="small" color="info" variant="outlined" />
                )}
            </Stack>

            {/* Lado Direito: Prévia no modo Igual */}
            {selected && splitType === 'equal' && (
                <Typography
                    variant="body2"
                    fontWeight={600}
                    color="primary.main"
                    sx={{ textAlign: { xs: 'right', sm: 'left' } }}
                >
                    {formatarMoeda(previewCents / 100)}
                </Typography>
            )}

            {/* Lado Direito: Inputs nos demais modos */}
            {selected && splitType !== 'equal' && (
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}
                >
                    {splitType === 'remaining' && isRemainder && (
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            color="info.main"
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            {formatarMoeda(previewCents / 100)}
                        </Typography>
                    )}

                    {(splitType === 'fixed' || splitType === 'remaining') && (
                        <MoneyTextField
                            size="small"
                            fullWidth
                            label={splitType === 'remaining' ? 'Fixo (vazio = resto)' : 'Valor'}
                            value={amount}
                            onChange={(value) => onAmountChange(participant.id, value)}
                            sx={{ width: { xs: '100%', sm: 210 } }}
                            disabled={disabled}
                        />
                    )}

                    {splitType === 'percentage' && (
                        <NumericTextField
                            size="small"
                            fullWidth
                            decimal
                            minValue={0}
                            maxValue={100}
                            label="Percentual"
                            value={percentage ?? ''}
                            onChange={(val) => onPercentageChange(participant.id, val ?? null)}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <Typography variant="body2" color="text.secondary">
                                            %
                                        </Typography>
                                    ),
                                },
                            }}
                            sx={{ width: { xs: '100%', sm: 145 } }}
                            disabled={disabled}
                        />
                    )}

                    {canComplete && (
                        <Button
                            size="small"
                            variant="text"
                            startIcon={<AutoFixHighOutlined fontSize="small" />}
                            onClick={() => onCompleteRemaining(participant.id)}
                            disabled={disabled}
                            sx={{ textTransform: 'none', whiteSpace: 'nowrap', px: 1 }}
                        >
                            Completar
                        </Button>
                    )}
                </Stack>
            )}
        </Box>
    );
};
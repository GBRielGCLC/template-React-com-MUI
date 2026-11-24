import { ButtonBase, Grid, Stack, Typography, alpha } from '@mui/material';
import {
    BalanceOutlined,
    FunctionsOutlined,
    PaidOutlined,
    PercentOutlined,
} from '@mui/icons-material';
import { SplitType } from '../../../../../Services/Api/Types';
import { SPLIT_OPTIONS } from '../useExpenseForm';

interface SplitTypeSelectorProps {
    value: SplitType;
    disabled?: boolean;
    onChange: (value: SplitType) => void;
}

const SPLIT_CARD_META: Record<SplitType, { shortDesc: string; icon: React.ReactNode }> = {
    equal: {
        shortDesc: 'Partes iguais entre os marcados',
        icon: <BalanceOutlined fontSize="small" />,
    },
    fixed: {
        shortDesc: 'Valor exato para cada pessoa',
        icon: <PaidOutlined fontSize="small" />,
    },
    percentage: {
        shortDesc: 'Fatia em % (soma 100%)',
        icon: <PercentOutlined fontSize="small" />,
    },
    remaining: {
        shortDesc: 'Alguns fixos, resto dividido',
        icon: <FunctionsOutlined fontSize="small" />,
    },
};

export const SplitTypeSelector = ({ value, disabled, onChange }: SplitTypeSelectorProps) => {
    return (
        <Grid container spacing={1.25} sx={{ mb: 2 }}>
            {SPLIT_OPTIONS.map((option) => {
                const active = value === option.value;
                const meta = SPLIT_CARD_META[option.value];

                return (
                    <Grid key={option.value} size={{ xs: 6, sm: 3 }}>
                        <ButtonBase
                            onClick={() => onChange(option.value)}
                            disabled={disabled}
                            sx={(theme) => ({
                                width: '100%',
                                height: '100%',
                                p: 1.25,
                                borderRadius: 1.5,
                                border: 1,
                                borderColor: active ? 'primary.main' : 'divider',
                                bgcolor: active
                                    ? alpha(theme.palette.primary.main, 0.08)
                                    : 'background.paper',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                transition: 'all 0.15s ease-in-out',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                                },
                            })}
                        >
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.75}
                                sx={{
                                    color: active ? 'primary.main' : 'text.primary',
                                    mb: 0.5,
                                }}
                            >
                                {meta.icon}
                                <Typography variant="body2" fontWeight={600}>
                                    {option.label}
                                </Typography>
                            </Stack>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ lineHeight: 1.3 }}
                            >
                                {meta.shortDesc}
                            </Typography>
                        </ButtonBase>
                    </Grid>
                );
            })}
        </Grid>
    );
};
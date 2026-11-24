import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { ContentCopy, Refresh } from '@mui/icons-material';
import { BalancesService } from '../../Services/Api/Balances/BalancesService';
import { BalanceParticipantDto, BalancesResponse, SettlementDto, SettlementsResponse } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { formatarMoeda } from '../../Services/Formatters';
import { toastManager } from '../../Services/ToastUtils';

interface SummaryTabProps {
    eventId: string;
}

/** Valor monetário com cor: positivo = a receber, negativo = deve. */
const NetValue = ({ cents }: { cents: number }) => {
    const color = cents > 0 ? 'success.main' : cents < 0 ? 'error.main' : 'text.secondary';
    return (
        <Typography component="span" fontWeight={600} sx={{ color }}>
            {formatarMoeda(cents / 100)}
        </Typography>
    );
};

const SettlementRow = ({ settlement, onCopyPix }: {
    settlement: SettlementDto;
    onCopyPix: (pix: string) => void;
}) => (
    <TableRow>
        <TableCell>{settlement.fromName}</TableCell>
        <TableCell align="center">→</TableCell>
        <TableCell>{settlement.toName}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatarMoeda(settlement.amountCents / 100)}</TableCell>
        <TableCell align="right">
            {settlement.toPixKey && (
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={() => onCopyPix(settlement.toPixKey!)}
                >
                    Copiar Pix
                </Button>
            )}
        </TableCell>
    </TableRow>
);

export const SummaryTab = ({ eventId }: SummaryTabProps) => {
    const [balances, setBalances] = useState<BalancesResponse | null>(null);
    const [settlements, setSettlements] = useState<SettlementsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        // Carrega as duas chamadas em paralelo; erro em uma não mata a outra.
        Promise.allSettled([
            BalancesService.GetBalances(eventId),
            BalancesService.GetSettlements(eventId),
        ])
            .then(([balancesResult, settlementsResult]) => {
                if (cancelled) return;
                if (balancesResult.status === 'fulfilled') setBalances(balancesResult.value);
                else console.error('Erro ao carregar saldos:', toApiError(balancesResult.reason));

                if (settlementsResult.status === 'fulfilled') setSettlements(settlementsResult.value);
                else console.error('Erro ao carregar acertos:', toApiError(settlementsResult.reason));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId, reloadKey]);

    const handleCopyPix = (pix: string) => {
        navigator.clipboard.writeText(pix)
            .then(() => toastManager.success('Chave Pix copiada!'))
            .catch(() => toastManager.error('Não foi possível copiar.'));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="rounded" height={100} />
                <Skeleton variant="rounded" height={240} />
            </Box>
        );
    }

    const pendingPayments = settlements?.pendingInformedPayments ?? [];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Resumo geral */}
            {balances && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
                    <Card variant="outlined">
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="overline" color="text.secondary">
                                Total de despesas
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                                {formatarMoeda(balances.totalExpensesCents / 100)}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card variant="outlined">
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="overline" color="text.secondary">
                                Pagamentos confirmados
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color="success.main">
                                {formatarMoeda(balances.confirmedPaymentsCents / 100)}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card variant="outlined">
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="overline" color="text.secondary">
                                Aguardando confirmação
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color={balances.informedPaymentsCents > 0 ? 'warning.main' : 'inherit'}>
                                {formatarMoeda(balances.informedPaymentsCents / 100)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Pagamentos pendentes de confirmação */}
            {pendingPayments.length > 0 && (
                <Alert
                    severity="warning"
                    action={
                        <Button color="inherit" size="small" startIcon={<Refresh />} onClick={refresh}>
                            Atualizar
                        </Button>
                    }
                >
                    <Typography variant="subtitle2">
                        {pendingPayments.length} pagamento{pendingPayments.length > 1 ? 's' : ''} aguardando confirmação do administrador.
                    </Typography>
                    {pendingPayments.map((payment) => (
                        <Typography key={payment.id} variant="body2">
                            {payment.from.name} → {payment.to.name}: {formatarMoeda(payment.amountCents / 100)}
                        </Typography>
                    ))}
                </Alert>
            )}

            {/* Saldos por participante */}
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Saldo por participante
                    </Typography>
                    <Button size="small" startIcon={<Refresh />} onClick={refresh}>
                        Atualizar
                    </Button>
                </Box>

                {!balances || balances.participants.length === 0 ? (
                    <Typography color="text.secondary">
                        Nenhuma despesa registrada ainda.
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Participante</TableCell>
                                    <TableCell align="right">Pagou</TableCell>
                                    <TableCell align="right">Deveria</TableCell>
                                    <TableCell align="right">Saldo</TableCell>
                                    <TableCell align="right">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {balances.participants.map((participant: BalanceParticipantDto) => (
                                    <TableRow key={participant.participantId}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography fontWeight={participant.isActive ? 600 : 400}>
                                                    {participant.name}
                                                </Typography>
                                                {!participant.isActive && (
                                                    <Chip label="Inativo" size="small" />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatarMoeda(participant.paidCents / 100)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatarMoeda(participant.owedCents / 100)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <NetValue cents={participant.adjustedNetCents} />
                                        </TableCell>
                                        <TableCell align="right">
                                            {participant.adjustedNetCents > 0
                                                ? <Chip label="A receber" color="success" size="small" variant="outlined" />
                                                : participant.adjustedNetCents < 0
                                                    ? <Chip label="Deve" color="error" size="small" variant="outlined" />
                                                    : <Chip label="Zerado" color="default" size="small" variant="outlined" />}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            <Divider />

            {/* Acertos sugeridos */}
            <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Como acertar as contas
                </Typography>

                {!settlements || settlements.settlements.length === 0 ? (
                    <Typography color="text.secondary">
                        {balances && balances.participants.some((p) => p.adjustedNetCents !== 0)
                            ? 'Nenhum pagamento confirmado ainda — os acertos abaixo são projeções.'
                            : 'Tudo certo por aqui! Nenhum acerto pendente.'}
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>De</TableCell>
                                    <TableCell align="center" />
                                    <TableCell>Para</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell align="right">Pix</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {settlements.settlements.map((settlement) => (
                                    <SettlementRow
                                        key={`${settlement.fromParticipantId}-${settlement.toParticipantId}`}
                                        settlement={settlement}
                                        onCopyPix={handleCopyPix}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Projeção (confirmados + informados) */}
                {settlements && settlements.projectedSettlements.length > settlements.settlements.length && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Incluindo pagamentos ainda não confirmados:
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    {settlements.projectedSettlements
                                        .filter((projected) =>
                                            !settlements.settlements.some((official) =>
                                                official.fromParticipantId === projected.fromParticipantId
                                                && official.toParticipantId === projected.toParticipantId,
                                            ))
                                        .map((settlement) => (
                                            <SettlementRow
                                                key={`projected-${settlement.fromParticipantId}-${settlement.toParticipantId}`}
                                                settlement={settlement}
                                                onCopyPix={handleCopyPix}
                                            />
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

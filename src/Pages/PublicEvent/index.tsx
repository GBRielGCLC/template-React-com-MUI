import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { ContentCopy, OpenInNew, Refresh } from '@mui/icons-material';
import { PublicService } from '../../Services/Api/Public/PublicService';
import { PublicEventDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';
import { formatarDataHoraTela, formatarMoeda } from '../../Services/Formatters';

/** Rótulos dos tipos de divisão (enums serializados em camelCase). */
const SPLIT_LABELS: Record<string, string> = {
    equal: 'Igual',
    fixed: 'Valores fixos',
    percentage: 'Percentual',
    remaining: 'Restante',
};

const PAYMENT_LABELS: Record<string, { label: string; color: 'warning' | 'success' | 'error' }> = {
    informed: { label: 'Aguardando', color: 'warning' },
    confirmed: { label: 'Confirmado', color: 'success' },
    rejected: { label: 'Recusado', color: 'error' },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box sx={{ mt: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
            {title}
        </Typography>
        {children}
    </Box>
);

const Value = ({ cents }: { cents: number }) => {
    const color = cents > 0 ? 'success.main' : cents < 0 ? 'error.main' : 'text.secondary';
    return (
        <Typography component="span" fontWeight={600} sx={{ color }}>
            {formatarMoeda(cents / 100)}
        </Typography>
    );
};

/**
 * Página do link público (`/public/:token`) — **sem login**, visão somente
 * leitura agregada (evento, participantes, despesas, saldos, acertos e
 * pagamentos) devolvida em uma única chamada.
 *
 * O token é segredo (a resposta expõe chaves Pix): fica só na URL da rota.
 */
export const PublicEventPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<PublicEventDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        if (!token) {
            setError('Este link não é válido.');
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        PublicService.GetEvent(token)
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err) => {
                if (cancelled) return;
                const apiError = toApiError(err);
                setError(
                    apiError.status === 404
                        ? 'Este link não existe ou foi desativado pelo organizador do evento.'
                        : apiError.status === 0
                            ? 'Não foi possível carregar o evento. Verifique sua conexão.'
                            : apiError.message,
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [token, reloadKey]);

    const handleCopyPix = (pix: string) => {
        navigator.clipboard.writeText(pix)
            .then(() => toastManager.success('Chave Pix copiada!'))
            .catch(() => toastManager.error('Não foi possível copiar.'));
    };

    // --- Estados de carregamento/erro ---
    if (loading) {
        return (
            <Box sx={{ maxWidth: 960, mx: 'auto', px: 2, py: 4 }}>
                <Skeleton variant="rounded" height={96} />
                <Skeleton variant="rounded" height={120} sx={{ mt: 2 }} />
                <Skeleton variant="rounded" height={280} sx={{ mt: 2 }} />
            </Box>
        );
    }

    if (error || !data) {
        return (
            <Box sx={{ maxWidth: 560, mx: 'auto', px: 2, py: 8 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {error ?? 'Não foi possível carregar este evento.'}
                </Alert>
                <Button variant="outlined" onClick={() => navigate('/')}>
                    Ir para o Quitta
                </Button>
            </Box>
        );
    }

    const { event, participants, expenses, balances, settlements, payments } = data;
    const isClosed = event.status === 'closed';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Barra superior */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 3,
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Typography variant="h6" color="primary" fontWeight={700} sx={{ letterSpacing: 1 }}>
                    QUITTA
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Atualizar dados">
                        <IconButton size="small" onClick={refresh}>
                            <Refresh fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Button
                        size="small"
                        variant="outlined"
                        endIcon={<OpenInNew />}
                        onClick={() => navigate('/')}
                    >
                        Entrar
                    </Button>
                </Box>
            </Box>

            <Box sx={{ maxWidth: 960, mx: 'auto', px: 2, py: 3 }}>
                {/* Cabeçalho do evento */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="h4" fontWeight={600}>
                        {event.name}
                    </Typography>
                    <Chip
                        label={isClosed ? 'Encerrado' : 'Ativo'}
                        color={isClosed ? 'default' : 'success'}
                        size="small"
                    />
                    <Chip label="Visão somente leitura" color="info" size="small" variant="outlined" />
                </Box>
                {event.description && (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        {event.description}
                    </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                    Atualizado em {formatarDataHoraTela(event.updatedAt)}
                </Typography>

                {/* Resumo */}
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                        mt: 2,
                    }}
                >
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="overline" color="text.secondary">Total de despesas</Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {formatarMoeda(balances.totalExpensesCents / 100)}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="overline" color="text.secondary">Pagamentos confirmados</Typography>
                        <Typography variant="h6" fontWeight={600} color="success.main">
                            {formatarMoeda(balances.confirmedPaymentsCents / 100)}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="overline" color="text.secondary">Aguardando confirmação</Typography>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            color={balances.informedPaymentsCents > 0 ? 'warning.main' : 'inherit'}
                        >
                            {formatarMoeda(balances.informedPaymentsCents / 100)}
                        </Typography>
                    </Box>
                </Box>

                {/* Saldos */}
                <Section title="Saldo por participante">
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Participante</TableCell>
                                    <TableCell align="right">Pagou</TableCell>
                                    <TableCell align="right">Deveria</TableCell>
                                    <TableCell align="right">Saldo</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {balances.participants.map((participant) => (
                                    <TableRow key={participant.participantId}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography fontWeight={participant.isActive ? 600 : 400}>
                                                    {participant.name}
                                                </Typography>
                                                {!participant.isActive && <Chip label="Inativo" size="small" />}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatarMoeda(participant.paidCents / 100)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatarMoeda(participant.owedCents / 100)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Value cents={participant.adjustedNetCents} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Section>

                {/* Acertos */}
                <Section title="Como acertar as contas">
                    {settlements.settlements.length === 0 ? (
                        <Typography color="text.secondary">
                            {balances.participants.some((p) => p.adjustedNetCents !== 0)
                                ? 'Nenhum pagamento confirmado ainda.'
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
                                        <TableRow
                                            key={`${settlement.fromParticipantId}-${settlement.toParticipantId}`}
                                        >
                                            <TableCell>{settlement.fromName}</TableCell>
                                            <TableCell align="center">→</TableCell>
                                            <TableCell>{settlement.toName}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                {formatarMoeda(settlement.amountCents / 100)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {settlement.toPixKey && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<ContentCopy />}
                                                        onClick={() => handleCopyPix(settlement.toPixKey!)}
                                                    >
                                                        Copiar Pix
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Section>

                <Divider sx={{ my: 3 }} />

                {/* Despesas */}
                <Section title={`Despesas (${expenses.length})`}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Descrição</TableCell>
                                    <TableCell>Pago por</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Divisão</TableCell>
                                    <TableCell align="right">Participantes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {expense.description}
                                            </Typography>
                                            {expense.notes && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {expense.notes}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{expense.paidByParticipantName}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                            {formatarMoeda(expense.totalAmountInCents / 100)}
                                        </TableCell>
                                        <TableCell>
                                            {expense.date
                                                ? new Date(`${expense.date}T00:00:00`).toLocaleDateString('pt-BR')
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={SPLIT_LABELS[expense.splitType] ?? expense.splitType}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">{expense.shares.length}</TableCell>
                                    </TableRow>
                                ))}
                                {expenses.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="text.secondary">Nenhuma despesa registrada.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Section>

                {/* Pagamentos */}
                <Section title={`Pagamentos (${payments.length})`}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>De</TableCell>
                                    <TableCell>Para</TableCell>
                                    <TableCell align="right">Valor</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Informado em</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payments.map((payment) => {
                                    const meta = PAYMENT_LABELS[payment.status] ?? { label: payment.status, color: 'default' as const };
                                    return (
                                        <TableRow key={payment.id}>
                                            <TableCell>{payment.from.name}</TableCell>
                                            <TableCell>{payment.to.name}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                {formatarMoeda(payment.amountCents / 100)}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={payment.rejectionReason ?? ''}>
                                                    <Chip label={meta.label} color={meta.color} size="small" variant="outlined" />
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>{formatarDataHoraTela(payment.informedAt)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {payments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography color="text.secondary">Nenhum pagamento informado.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Section>

                {/* Participantes */}
                <Section title={`Participantes (${participants.length})`}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Chave Pix</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {participants.map((participant) => (
                                    <TableRow key={participant.id}>
                                        <TableCell>
                                            <Typography fontWeight={600}>{participant.name}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={participant.isActive ? 'Ativo' : 'Inativo'}
                                                color={participant.isActive ? 'success' : 'default'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {participant.pixKey ? (
                                                <Tooltip title="Copiar chave Pix">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopyPix(participant.pixKey!)}
                                                    >
                                                        <ContentCopy fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">—</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Section>

                <Divider sx={{ my: 3 }} />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: 'center', pb: 3 }}>
                    Link público do evento — visão somente leitura. Para registrar despesas ou pagamentos,
                    entre no Quitta ou use seu link de participante.
                </Typography>
            </Box>
        </Box>
    );
};

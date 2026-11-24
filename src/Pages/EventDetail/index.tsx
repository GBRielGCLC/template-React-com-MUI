import { useState, SyntheticEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    Skeleton,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { ArrowBack, AdminPanelSettings, Edit, Lock, LockOpen, Public } from '@mui/icons-material';
import { EventFormDialog } from '../Events/EventFormDialog';
import { EventsService } from '../../Services/Api/Events/EventsService';
import { toastManager } from '../../Services/ToastUtils';
import { toApiError } from '../../Services/Api/Errors';
import { useConfirm } from '../../Contexts/ConfirmDialogContext';
import { useAuth } from '../../Contexts/AuthContext';
import { useEventDetail } from './useEventDetail';
import { SummaryTab } from './SummaryTab';
import { ExpensesTab } from './Expenses/ExpensesTab';
import { ParticipantsTab } from './ParticipantsTab';
import { PaymentsTab } from './PaymentsTab';
import { AuditTab } from './AuditTab';
import { PublicLinkDialog } from './PublicLinkDialog';
import { EventAdminsDialog } from './EventAdminsDialog';

interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
        {value === index && children}
    </Box>
);

export const EventDetail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const confirm = useConfirm();
    const { isParticipant, participantEventId } = useAuth();
    const { event, loading, error, setEvent } = useEventDetail();

    const [tab, setTab] = useState(0);
    const [editOpen, setEditOpen] = useState(false);
    const [publicLinkOpen, setPublicLinkOpen] = useState(false);
    const [adminsOpen, setAdminsOpen] = useState(false);

    // Participante: sessão restrita a UM evento — se cair em outro, volta pro dele.
    const foreignEvent = isParticipant && !!participantEventId && !location.pathname.endsWith(participantEventId);
    if (foreignEvent && participantEventId) {
        return <Navigate to={`/events/${participantEventId}`} replace />;
    }

    const participantSelfId = isParticipant ? sessionStorage.getItem('participantId') : null;
    const participantSelfName = isParticipant ? sessionStorage.getItem('participantName') : null;

    const handleTabChange = (_: SyntheticEvent, newValue: number) => setTab(newValue);

    const handleToggleClose = () => {
        if (!event) return;
        const isClosed = event.status === 'closed';

        confirm({
            titulo: isClosed ? 'Reabrir evento' : 'Encerrar evento',
            conteudo: isClosed
                ? `Reabrir "${event.name}"? O evento voltará a aceitar despesas e pagamentos.`
                : `Encerrar "${event.name}"? Nada mais poderá ser alterado. Se houver pagamentos pendentes, a operação será bloqueada.`,
            textBtnConfirmar: isClosed ? 'Reabrir' : 'Encerrar',
            corBtnConfirmar: isClosed ? 'success' : 'warning',
            onConfirm: async ({ close, setLoading }) => {
                setLoading(true);
                try {
                    const updated = await (isClosed
                        ? EventsService.Reopen(event.id)
                        : EventsService.Close(event.id));
                    setEvent(updated);
                    toastManager.success(isClosed ? 'Evento reaberto!' : 'Evento encerrado!');
                } catch (err) {
                    // 422 event.pending_payments, 409 event.not_closed etc.
                    toastManager.error(toApiError(err).message);
                } finally {
                    close();
                }
            },
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="rounded" height={80} />
                <Skeleton variant="rounded" height={48} />
                <Skeleton variant="rounded" height={320} />
            </Box>
        );
    }

    if (error || !event) {
        const notFound = error?.status === 404;
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/events')}>
                    Voltar para eventos
                </Button>
                <Alert severity={notFound ? 'warning' : 'error'}>
                    {notFound
                        ? 'Evento não encontrado.'
                        : error?.status === 403
                            ? 'Você não tem acesso a este evento.'
                            : error?.message ?? 'Erro ao carregar o evento.'}
                    {error?.traceId && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            traceId: {error.traceId}
                        </Typography>
                    )}
                </Alert>
            </Box>
        );
    }

    const isClosed = event.status === 'closed';
    // Se as permissões mudarem enquanto a aba está aberta (ex.: remoção do
    // usuário como admin), volta para uma aba válida.
    const auditVisible = event.permissions.readAudit;
    const activeTab = auditVisible ? tab : Math.min(tab, 3);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Cabeçalho */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/events')}
                        sx={{ minWidth: 0, px: 1 }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Eventos</Box>
                    </Button>

                    <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="h4" fontWeight={600} noWrap>
                                {event.name}
                            </Typography>
                            <Chip
                                label={isClosed ? 'Encerrado' : 'Ativo'}
                                color={isClosed ? 'default' : 'success'}
                                size="small"
                            />
                            <Chip
                                label={event.requirePaymentConfirmation
                                    ? 'Confirmação de pagamento exigida'
                                    : 'Pagamentos confirmados automaticamente'}
                                color="info"
                                size="small"
                                variant="outlined"
                            />
                            {isParticipant && participantSelfName && (
                                <Chip
                                    label={`Participando como ${participantSelfName}`}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                        {event.description && (
                            <Typography variant="body2" color="text.secondary">
                                {event.description}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {event.permissions.manageEvent && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<AdminPanelSettings />}
                                onClick={() => setAdminsOpen(true)}
                            >
                                Administradores
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Public />}
                                onClick={() => setPublicLinkOpen(true)}
                            >
                                Link público
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                disabled={isClosed}
                                onClick={() => setEditOpen(true)}
                            >
                                Editar
                            </Button>
                            <Button
                                variant={isClosed ? 'contained' : 'outlined'}
                                color={isClosed ? 'success' : 'warning'}
                                startIcon={isClosed ? <LockOpen /> : <Lock />}
                                onClick={handleToggleClose}
                            >
                                {isClosed ? 'Reabrir' : 'Encerrar'}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Abas */}
            <Box>
                <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" allowScrollButtonsMobile>
                    <Tab label="Resumo" />
                    <Tab label="Despesas" />
                    <Tab label="Participantes" />
                    <Tab label="Pagamentos" />
                    {auditVisible && <Tab label="Auditoria" />}
                </Tabs>
            </Box>

            <TabPanel value={tab} index={0}>
                <SummaryTab eventId={event.id} />
            </TabPanel>

            <TabPanel value={tab} index={1}>
                <ExpensesTab
                    eventId={event.id}
                    canManage={event.permissions.manageExpenses}
                    canRegister={event.permissions.registerExpenses}
                    eventClosed={isClosed}
                />
            </TabPanel>

            <TabPanel value={tab} index={2}>
                <ParticipantsTab
                    eventId={event.id}
                    canManage={event.permissions.manageParticipants}
                    eventClosed={isClosed}
                />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
                <PaymentsTab
                    eventId={event.id}
                    canConfirm={event.permissions.confirmPayments}
                    eventClosed={isClosed}
                    active={activeTab === 3}
                    // PT só informa pagamento dele (`403 payment.self_only`).
                    lockedFromParticipantId={isParticipant ? participantSelfId : null}
                />
            </TabPanel>

            {/* Auditoria: só admin (`permissions.readAudit`). */}
            {auditVisible && (
                <TabPanel value={activeTab} index={4}>
                    <AuditTab eventId={event.id} />
                </TabPanel>
            )}

            <PublicLinkDialog
                open={publicLinkOpen}
                event={event}
                onClose={() => setPublicLinkOpen(false)}
                onEnabledChange={(enabled) => setEvent({ ...event, publicLinkEnabled: enabled })}
            />

            <EventAdminsDialog
                open={adminsOpen}
                eventId={event.id}
                onClose={() => setAdminsOpen(false)}
            />

            <EventFormDialog
                open={editOpen}
                event={event}
                onClose={() => setEditOpen(false)}
                onSaved={(updated) => {
                    setEditOpen(false);
                    setEvent(updated);
                }}
            />
        </Box>
    );
};

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, Check, Close } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { PersonalizedDataGrid } from '../../Components/PersonalizedDataGrid';
import { ActionButtons } from '../../Components/PersonalizedDataGrid/ActionButtons';
import { withDefaultColumns } from '../../Services/PersonalizedDataGrid';
import { PaymentsService } from '../../Services/Api/Payments/PaymentsService';
import { PaymentDto, PaymentStatus } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';
import { formatarDataHoraTela, formatarMoeda } from '../../Services/Formatters';
import { useConfirm } from '../../Contexts/ConfirmDialogContext';
import { getTablePagination } from '../../Services/PersonalizedDataGrid/tableConfig';
import { IPagination } from '../../Services/Api/Utils';
import { PaymentFormDialog } from './PaymentFormDialog';
import { PaymentRejectDialog } from './PaymentRejectDialog';

interface PaymentsTabProps {
    eventId: string;
    /** `permissions.confirmPayments` — confirmar/recusar. */
    canConfirm: boolean;
    eventClosed: boolean;
    /** Mudou quando a aba é reativada (para recarregar após voltar de outra aba). */
    active: boolean;
    /** Sessão de participante: trava o "De" no próprio participante. */
    lockedFromParticipantId?: string | null;
}

const TABLE_ID = 'event-payments';

const STATUS_LABELS: Record<PaymentStatus, { label: string; color: 'warning' | 'success' | 'error' }> = {
    informed: { label: 'Aguardando', color: 'warning' },
    confirmed: { label: 'Confirmado', color: 'success' },
    rejected: { label: 'Recusado', color: 'error' },
};

export const PaymentsTab = ({ eventId, canConfirm, eventClosed, active, lockedFromParticipantId }: PaymentsTabProps) => {
    const confirm = useConfirm();

    const [rows, setRows] = useState<PaymentDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'' | PaymentStatus>('');
    const [pagination, setPagination] = useState<IPagination>(() => getTablePagination(TABLE_ID));
    const [reloadKey, setReloadKey] = useState(0);

    const [formOpen, setFormOpen] = useState(false);
    const [rejecting, setRejecting] = useState<PaymentDto | null>(null);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        if (!active) return;

        let cancelled = false;
        setLoading(true);

        PaymentsService.List(eventId, {
            page: pagination.currentPage,
            pageSize: pagination.itensPorPagina,
            status: statusFilter || undefined,
        })
            .then((result) => {
                if (cancelled) return;
                setRows(result.items);
                setTotalItems(result.totalItems);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Erro ao carregar pagamentos:', toApiError(error));
                setRows([]);
                setTotalItems(0);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId, pagination, statusFilter, reloadKey, active]);

    const handleConfirm = useCallback((row: PaymentDto) => {
        confirm({
            titulo: 'Confirmar pagamento',
            conteudo: `Confirmar o pagamento de ${formatarMoeda(row.amountCents / 100)} de ${row.from.name} para ${row.to.name}? O saldo será recalculado.`,
            textBtnConfirmar: 'Confirmar',
            corBtnConfirmar: 'success',
            onConfirm: async ({ close, setLoading: setDlgLoading }) => {
                setDlgLoading(true);
                try {
                    await PaymentsService.Confirm(eventId, row.id);
                    toastManager.success('Pagamento confirmado!');
                    refresh();
                } catch (error) {
                    // 409 payment.not_informed
                    toastManager.error(toApiError(error).message);
                } finally {
                    close();
                }
            },
        });
    }, [confirm, eventId, refresh]);

    const columns = useMemo<GridColDef[]>(() => withDefaultColumns([
        {
            field: 'from',
            headerName: 'De',
            minWidth: 140,
            flex: 1,
            sortable: false,
            renderCell: (params: GridRenderCellParams<PaymentDto>) => params.row.from.name,
        },
        {
            field: 'to',
            headerName: 'Para',
            minWidth: 140,
            flex: 1,
            sortable: false,
            renderCell: (params: GridRenderCellParams<PaymentDto>) => params.row.to.name,
        },
        {
            field: 'amountCents',
            headerName: 'Valor',
            minWidth: 110,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            renderCell: (params: GridRenderCellParams<PaymentDto>) => (
                <Typography variant="body2" fontWeight={600}>
                    {formatarMoeda(params.value / 100)}
                </Typography>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            minWidth: 130,
            sortable: false,
            renderCell: (params: GridRenderCellParams<PaymentDto>) => {
                const meta = STATUS_LABELS[params.value as PaymentStatus];
                const status = params.row.status;
                const base = <Chip label={meta.label} color={meta.color} size="small" variant="outlined" />;

                if (status === 'rejected' && params.row.rejectionReason) {
                    return (
                        <Tooltip title={params.row.rejectionReason}>
                            {base}
                        </Tooltip>
                    );
                }
                return base;
            },
        },
        {
            field: 'informedAt',
            headerName: 'Informado em',
            minWidth: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams<PaymentDto>) => formatarDataHoraTela(params.value),
        },
        {
            field: 'note',
            headerName: 'Observação',
            minWidth: 160,
            flex: 1,
            sortable: false,
            renderCell: (params: GridRenderCellParams<PaymentDto>) => (
                <Typography variant="body2" color="text.secondary" noWrap>
                    {params.value || '—'}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Ações',
            minWidth: 110,
            sortable: false,
            renderCell: (params: GridRenderCellParams<PaymentDto>) => {
                if (!canConfirm || params.row.status !== 'informed') return null;
                if (eventClosed) return null;

                return (
                    <ActionButtons
                        params={params}
                        actions={[
                            {
                                label: 'Confirmar',
                                icon: <Check color="success" />,
                                tooltip: 'Confirmar pagamento',
                                onClick: () => handleConfirm(params.row),
                            },
                            {
                                label: 'Recusar',
                                icon: <Close color="error" />,
                                tooltip: 'Recusar pagamento',
                                onClick: () => setRejecting(params.row),
                            },
                        ]}
                    />
                );
            },
        },
    ]), [canConfirm, eventClosed, handleConfirm]);

    const canCreate = !eventClosed;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {eventClosed && (
                <Alert severity="info">
                    Este evento está encerrado — os pagamentos são somente para consulta.
                </Alert>
            )}

            {!eventClosed && (
                <Alert severity="info" variant="outlined">
                    Pagamentos informados ficam <strong>aguardando confirmação</strong> do administrador
                    enquanto o evento exigir confirmação. Recusas precisam de motivo.
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as '' | PaymentStatus);
                        setPagination((p) => ({ ...p, currentPage: 1 }));
                    }}
                    sx={{ minWidth: 180 }}
                    slotProps={{ inputLabel: { shrink: true } }}
                >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="informed">Aguardando</MenuItem>
                    <MenuItem value="confirmed">Confirmados</MenuItem>
                    <MenuItem value="rejected">Recusados</MenuItem>
                </TextField>

                <Box sx={{ flexGrow: 1 }} />

                {canCreate && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setFormOpen(true)}
                    >
                        Informar pagamento
                    </Button>
                )}
            </Box>

            <PersonalizedDataGrid
                tableId={TABLE_ID}
                rows={rows}
                columns={columns}
                loading={loading}
                totalItems={totalItems}
                paginationMode="server"
                onPagination={setPagination}
                onRefresh={refresh}
                getRowId={(row: PaymentDto) => row.id}
                disableColumnFilter
                disableColumnSorting
            />

            <PaymentFormDialog
                open={formOpen}
                eventId={eventId}
                lockedFromParticipantId={lockedFromParticipantId}
                onClose={() => setFormOpen(false)}
                onSaved={() => {
                    setFormOpen(false);
                    refresh();
                }}
            />

            <PaymentRejectDialog
                open={!!rejecting}
                eventId={eventId}
                payment={rejecting}
                onClose={() => setRejecting(null)}
                onSaved={() => {
                    setRejecting(null);
                    refresh();
                }}
            />
        </Box>
    );
};

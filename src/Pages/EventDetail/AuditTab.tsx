import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { PersonalizedDataGrid } from '../../Components/PersonalizedDataGrid';
import { withDefaultColumns } from '../../Services/PersonalizedDataGrid';
import { getTablePagination } from '../../Services/PersonalizedDataGrid/tableConfig';
import { AuditService } from '../../Services/Api/Audit/AuditService';
import { AuditLogDto } from '../../Services/Api/Types';
import { toApiError, ApiError } from '../../Services/Api/Errors';
import { formatarDataHoraTela } from '../../Services/Formatters';
import { IPagination } from '../../Services/Api/Utils';

interface AuditTabProps {
    eventId: string;
}

const TABLE_ID = 'event-audit';

/** Rótulo pt-BR das `action` possíveis (fallback: o valor cru). */
const ACTION_LABELS: Record<string, string> = {
    'event.created': 'Evento criado',
    'event.updated': 'Evento atualizado',
    'event.closed': 'Evento encerrado',
    'event.reopened': 'Evento reaberto',
    'event.public_link_enabled': 'Link público ativado',
    'event.public_link_rotated': 'Link público rotacionado',
    'event.public_link_disabled': 'Link público desativado',
    'event.admin_added': 'Administrador adicionado',
    'event.admin_removed': 'Administrador removido',
    'participant.created': 'Participante criado',
    'participant.updated': 'Participante atualizado',
    'participant.access_token_rotated': 'Link de acesso rotacionado',
    'participant.deactivated': 'Participante desativado',
    'participant.reactivated': 'Participante reativado',
    'expense.created': 'Despesa criada',
    'expense.updated': 'Despesa atualizada',
    'expense.deleted': 'Despesa excluída',
    'payment.informed': 'Pagamento informado',
    'payment.confirmed': 'Pagamento confirmado',
    'payment.rejected': 'Pagamento recusado',
};

const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

const actionColor = (action: string): 'default' | 'primary' | 'info' | 'warning' | 'error' | 'success' => {
    if (action.startsWith('event.')) return 'info';
    if (action.startsWith('participant.')) return 'primary';
    if (action.startsWith('expense.')) return 'warning';
    if (action.startsWith('payment.')) return 'success';
    return 'default';
};

const ACTOR_LABELS: Record<string, { label: string; color: 'default' | 'primary' | 'info' }> = {
    user: { label: 'Usuário', color: 'primary' },
    participant: { label: 'Participante', color: 'info' },
    system: { label: 'Sistema', color: 'default' },
};

/** `entityType` vem do backend em inglês; traduz o que conhecemos. */
const ENTITY_LABELS: Record<string, string> = {
    event: 'Evento',
    participant: 'Participante',
    expense: 'Despesa',
    payment: 'Pagamento',
};

const entityLabel = (entityType: string) => {
    const key = entityType.toLowerCase();
    return ENTITY_LABELS[key] ?? entityType;
};

/** Linha de metadados do diálogo de detalhes. */
const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
    <Box sx={{ display: 'flex', gap: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>
            {label}
        </Typography>
        <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
            {value || '—'}
        </Typography>
    </Box>
);

/**
 * Trilha de auditoria do evento (`GET /events/{eventId}/audit`).
 * Sem busca/ordenação — a API devolve sempre o mais recente primeiro.
 * Acesso: apenas admin do evento (a aba só é renderizada com `permissions.readAudit`).
 */
export const AuditTab = ({ eventId }: AuditTabProps) => {
    const [rows, setRows] = useState<AuditLogDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ApiError | null>(null);
    const [pagination, setPagination] = useState<IPagination>(() => getTablePagination(TABLE_ID));
    const [reloadKey, setReloadKey] = useState(0);
    const [detail, setDetail] = useState<AuditLogDto | null>(null);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        AuditService.List(eventId, {
            page: pagination.currentPage,
            pageSize: pagination.itensPorPagina,
        })
            .then((result) => {
                if (cancelled) return;
                setRows(result.items);
                setTotalItems(result.totalItems);
                setError(null);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Erro ao carregar auditoria:', toApiError(err));
                setRows([]);
                setTotalItems(0);
                setError(toApiError(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId, pagination, reloadKey]);

    const columns = useMemo<GridColDef[]>(() => withDefaultColumns([
        {
            field: 'occurredAt',
            headerName: 'Data',
            minWidth: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams<AuditLogDto>) => formatarDataHoraTela(params.value),
        },
        {
            field: 'action',
            headerName: 'Ação',
            minWidth: 220,
            flex: 1.5,
            sortable: false,
            renderCell: (params: GridRenderCellParams<AuditLogDto>) => (
                <Chip
                    label={actionLabel(params.value)}
                    color={actionColor(params.value)}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: 'actorType',
            headerName: 'Autor',
            minWidth: 130,
            sortable: false,
            renderCell: (params: GridRenderCellParams<AuditLogDto>) => {
                const actor = ACTOR_LABELS[params.value] ?? { label: params.value, color: 'default' as const };
                return <Chip label={actor.label} color={actor.color} size="small" />;
            },
        },
        {
            field: 'entityType',
            headerName: 'Entidade',
            minWidth: 130,
            sortable: false,
            renderCell: (params: GridRenderCellParams<AuditLogDto>) => (
                <Typography variant="body2">{entityLabel(params.value)}</Typography>
            ),
        },
        {
            field: 'details',
            headerName: 'Detalhes',
            minWidth: 110,
            sortable: false,
            renderCell: (params: GridRenderCellParams<AuditLogDto>) => (
                <Tooltip title="Ver detalhes do registro">
                    <IconButton
                        size="small"
                        aria-label="Ver detalhes"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDetail(params.row);
                        }}
                    >
                        <InfoOutlined fontSize="small" />
                    </IconButton>
                </Tooltip>
            ),
        },
    ]), []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" variant="outlined">
                Registro de tudo o que aconteceu no evento, do mais recente para o mais antigo.
                Apenas administradores podem consultar esta trilha.
            </Alert>

            {error && (
                <Alert severity="error">
                    {error.status === 403
                        ? 'Você não tem permissão para consultar a auditoria deste evento.'
                        : error.message}
                    {error.traceId && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            traceId: {error.traceId}
                        </Typography>
                    )}
                </Alert>
            )}

            <PersonalizedDataGrid
                tableId={TABLE_ID}
                rows={rows}
                columns={columns}
                loading={loading}
                totalItems={totalItems}
                paginationMode="server"
                onPagination={setPagination}
                onRefresh={refresh}
                getRowId={(row: AuditLogDto) => row.id}
                disableColumnFilter
                disableColumnSorting
            />

            <Dialog open={!!detail} onClose={() => setDetail(null)} fullWidth maxWidth="sm">
                <DialogTitle>Detalhes do registro</DialogTitle>
                <DialogContent>
                    <Stack spacing={1} sx={{ pt: 1 }}>
                        <DetailRow label="Ação" value={detail ? actionLabel(detail.action) : null} />
                        <DetailRow label="Código da ação" value={detail?.action} />
                        <DetailRow label="Entidade" value={detail ? entityLabel(detail.entityType) : null} />
                        <DetailRow label="ID da entidade" value={detail?.entityId} />
                        <DetailRow
                            label="Autor"
                            value={detail ? ACTOR_LABELS[detail.actorType]?.label ?? detail.actorType : null}
                        />
                        <DetailRow label="ID do usuário" value={detail?.actorUserId} />
                        <DetailRow label="ID do participante" value={detail?.actorParticipantId} />
                        <DetailRow label="Correlation ID" value={detail?.correlationId} />
                        <DetailRow label="Ocorrido em" value={detail ? formatarDataHoraTela(detail.occurredAt) : null} />

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="subtitle2">Dados do evento</Typography>
                        {detail?.data ? (
                            <Box
                                component="pre"
                                sx={{
                                    m: 0,
                                    p: 1.5,
                                    borderRadius: 1,
                                    bgcolor: 'action.hover',
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    overflow: 'auto',
                                    maxHeight: 280,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {JSON.stringify(detail.data, null, 2)}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Sem dados adicionais.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDetail(null)} variant="contained">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

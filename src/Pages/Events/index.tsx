import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    Typography,
} from '@mui/material';
import {
    Add,
    Edit,
    Lock,
    LockOpen,
    OpenInNew,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams, GridSortModel } from '@mui/x-data-grid';
import { PersonalizedDataGrid } from '../../Components/PersonalizedDataGrid';
import { ActionButtons } from '../../Components/PersonalizedDataGrid/ActionButtons';
import { withDefaultColumns } from '../../Services/PersonalizedDataGrid';
import { formatarDataHoraTela } from '../../Services/Formatters';
import { toastManager } from '../../Services/ToastUtils';
import { EventsService } from '../../Services/Api/Events/EventsService';
import { EventDto, EventListItemDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { useConfirm } from '../../Contexts/ConfirmDialogContext';
import { useEvents } from './useEvents';
import { EventFormDialog } from './EventFormDialog';

/** Sorts permitidos pela API para eventos (ver contrato, seção 3). */
const ALLOWED_SORT_FIELDS = new Set(['name', 'createdAt', 'updatedAt']);

const statusChip = (status: string) => (
    status === 'active'
        ? <Chip label="Ativo" color="success" size="small" variant="outlined" />
        : <Chip label="Encerrado" color="default" size="small" />
);

export const Events = () => {
    const navigate = useNavigate();
    const confirm = useConfirm();

    const {
        rows,
        totalItems,
        loading,
        setPagination,
        sortModel,
        setSortModel,
        refresh,
        tableId,
    } = useEvents();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventDto | null>(null);

    // A DataGrid pode ordenar por qualquer coluna; a API aceita só 1 sort
    // e apenas 3 campos (name, createdAt, updatedAt).
    const handleSortModelChange = (model: GridSortModel) => {
        const filtered = model
            .filter((item) => ALLOWED_SORT_FIELDS.has(item.field))
            .slice(0, 1);
        setSortModel(filtered);
    };

    const handleOpenEvent = useCallback((row: EventListItemDto) => {
        navigate(`/events/${row.id}`);
    }, [navigate]);

    const handleEdit = useCallback((row: EventListItemDto) => {
        // EventListItemDto não tem permissions/currency; busca o detalhe antes de editar.
        EventsService.Get(row.id)
            .then((event) => {
                setEditingEvent(event);
                setDialogOpen(true);
            })
            .catch((error) => toastManager.error(toApiError(error).message));
    }, []);

    const handleToggleClose = useCallback((row: EventListItemDto) => {
        const isClosed = row.status === 'closed';

        confirm({
            titulo: isClosed ? 'Reabrir evento' : 'Encerrar evento',
            conteudo: isClosed
                ? `Reabrir "${row.name}"? O evento voltará a aceitar despesas e pagamentos.`
                : `Encerrar "${row.name}"? Nada mais poderá ser alterado. Se houver pagamentos pendentes, a operação será bloqueada.`,
            textBtnConfirmar: isClosed ? 'Reabrir' : 'Encerrar',
            corBtnConfirmar: isClosed ? 'success' : 'warning',
            onConfirm: async ({ close, setLoading }) => {
                setLoading(true);
                try {
                    await (isClosed ? EventsService.Reopen(row.id) : EventsService.Close(row.id));
                    toastManager.success(isClosed ? 'Evento reaberto!' : 'Evento encerrado!');
                    close();
                    refresh();
                } catch (error) {
                    // 422 event.pending_payments, 409 event.not_closed etc.
                    toastManager.error(toApiError(error).message);
                    close();
                }
            },
        });
    }, [confirm, refresh]);

    const columns = useMemo<GridColDef[]>(() => withDefaultColumns([
        {
            field: 'name',
            headerName: 'Nome',
            minWidth: 220,
            flex: 2,
            sortable: true,
            renderCell: (params: GridRenderCellParams<EventListItemDto>) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {params.row.name}
                    </Typography>
                    {params.row.description && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {params.row.description}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            minWidth: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<EventListItemDto>) => statusChip(params.value),
        },
        {
            field: 'requirePaymentConfirmation',
            headerName: 'Confirmação de pagamento',
            minWidth: 180,
            sortable: false,
            renderCell: (params: GridRenderCellParams<EventListItemDto>) => (
                params.value
                    ? <Chip label="Exigida" color="info" size="small" variant="outlined" />
                    : <Chip label="Automática" color="default" size="small" variant="outlined" />
            ),
        },
        {
            field: 'updatedAt',
            headerName: 'Atualizado em',
            minWidth: 150,
            sortable: true,
            renderCell: (params: GridRenderCellParams<EventListItemDto>) => formatarDataHoraTela(params.value),
        },
        {
            field: 'createdAt',
            headerName: 'Criado em',
            minWidth: 150,
            sortable: true,
            renderCell: (params: GridRenderCellParams<EventListItemDto>) => formatarDataHoraTela(params.value),
        },
        {
            field: 'actions',
            headerName: 'Ações',
            minWidth: 160,
            sortable: false,
            renderCell: (params: GridRenderCellParams<EventListItemDto>) => (
                <ActionButtons
                    params={params}
                    actions={[
                        {
                            label: 'Abrir',
                            icon: <OpenInNew color="primary" />,
                            tooltip: 'Abrir evento',
                            onClick: () => handleOpenEvent(params.row),
                        },
                        {
                            label: 'Editar',
                            icon: <Edit color="success" />,
                            disabled: params.row.status === 'closed',
                            tooltip: params.row.status === 'closed'
                                ? 'Evento encerrado não pode ser editado'
                                : 'Editar evento',
                            onClick: () => handleEdit(params.row),
                        },
                        params.row.status === 'active'
                            ? {
                                label: 'Encerrar',
                                icon: <Lock color="warning" />,
                                onClick: () => handleToggleClose(params.row),
                            }
                            : {
                                label: 'Reabrir',
                                icon: <LockOpen color="success" />,
                                onClick: () => handleToggleClose(params.row),
                            },
                    ]}
                />
            ),
        },
    ]), [handleOpenEvent, handleEdit, handleToggleClose]);

    const handleSaved = (_event: EventDto) => {
        setDialogOpen(false);
        setEditingEvent(null);
        refresh();
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={600}>
                        Eventos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Viagens, dividanças e contas em comum.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                        setEditingEvent(null);
                        setDialogOpen(true);
                    }}
                >
                    Novo evento
                </Button>
            </Box>

            <PersonalizedDataGrid
                tableId={tableId}
                rows={rows}
                columns={columns}
                loading={loading}
                totalItems={totalItems}
                paginationMode="server"
                sortModel={sortModel}
                onSortModelChange={handleSortModelChange}
                onPagination={setPagination}
                onRefresh={refresh}
                getRowId={(row: EventListItemDto) => row.id}
                disableColumnFilter
            />

            <EventFormDialog
                open={dialogOpen}
                event={editingEvent}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingEvent(null);
                }}
                onSaved={handleSaved}
            />
        </Box>
    );
};

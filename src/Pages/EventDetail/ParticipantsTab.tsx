import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, ContentCopy, Key, PersonAdd, PersonOff, PersonOutline } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { PersonalizedDataGrid } from '../../Components/PersonalizedDataGrid';
import { ActionButtons } from '../../Components/PersonalizedDataGrid/ActionButtons';
import { withDefaultColumns } from '../../Services/PersonalizedDataGrid';
import { ParticipantsService } from '../../Services/Api/Participants/ParticipantsService';
import { ParticipantDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';
import { formatarDataHoraTela } from '../../Services/Formatters';
import { useConfirm } from '../../Contexts/ConfirmDialogContext';
import { getTablePagination } from '../../Services/PersonalizedDataGrid/tableConfig';
import { IPagination } from '../../Services/Api/Utils';
import { ParticipantFormDialog } from './ParticipantFormDialog';
import { ParticipantTokenDialog } from './ParticipantTokenDialog';

interface ParticipantsTabProps {
    eventId: string;
    canManage: boolean;
    eventClosed: boolean;
}

const TABLE_ID = 'event-participants';

export const ParticipantsTab = ({ eventId, canManage, eventClosed }: ParticipantsTabProps) => {
    const confirm = useConfirm();

    const [rows, setRows] = useState<ParticipantDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<IPagination>(() => getTablePagination(TABLE_ID));
    const [reloadKey, setReloadKey] = useState(0);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ParticipantDto | null>(null);
    /** Token cru exibido uma única vez (criação/rotação). */
    const [tokenDialog, setTokenDialog] = useState<{ name: string; token: string } | null>(null);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        // Debounce simples da busca.
        const timer = setTimeout(() => {
            ParticipantsService.List(eventId, {
                page: pagination.currentPage,
                pageSize: pagination.itensPorPagina,
                search: search.trim() || undefined,
            })
                .then((result) => {
                    if (cancelled) return;
                    setRows(result.items);
                    setTotalItems(result.totalItems);
                })
                .catch((error) => {
                    if (cancelled) return;
                    console.error('Erro ao carregar participantes:', toApiError(error));
                    setRows([]);
                    setTotalItems(0);
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [eventId, pagination, search, reloadKey]);

    const handleToggleActive = useCallback((row: ParticipantDto) => {
        if (row.isActive) {
            confirm({
                titulo: 'Desativar participante',
                conteudo: `Desativar "${row.name}"? Participantes com saldo aberto ou pagamento pendente não podem ser desativados.`,
                textBtnConfirmar: 'Desativar',
                corBtnConfirmar: 'warning',
                onConfirm: async ({ close, setLoading: setDlgLoading }) => {
                    setDlgLoading(true);
                    try {
                        await ParticipantsService.Deactivate(eventId, row.id);
                        toastManager.success('Participante desativado.');
                        refresh();
                    } catch (error) {
                        // 422 participant.open_balance / participant.pending_payment
                        toastManager.error(toApiError(error).message);
                    } finally {
                        close();
                    }
                },
            });
        } else {
            ParticipantsService.Reactivate(eventId, row.id)
                .then(() => {
                    toastManager.success('Participante reativado.');
                    refresh();
                })
                .catch((error) => toastManager.error(toApiError(error).message));
        }
    }, [confirm, eventId, refresh]);

    const handleRotateToken = useCallback((row: ParticipantDto) => {
        confirm({
            titulo: 'Gerar novo link de acesso',
            conteudo: `Gerar um novo token de acesso para "${row.name}"? O link atual deixará de funcionar imediatamente.`,
            textBtnConfirmar: 'Gerar novo token',
            onConfirm: async ({ close, setLoading: setDlgLoading }) => {
                setDlgLoading(true);
                try {
                    const result = await ParticipantsService.RotateAccessToken(eventId, row.id);
                    setTokenDialog({ name: row.name, token: result.accessToken });
                    close();
                } catch (error) {
                    toastManager.error(toApiError(error).message);
                    close();
                }
            },
        });
    }, [confirm, eventId]);

    const columns = useMemo<GridColDef[]>(() => withDefaultColumns([
        {
            field: 'name',
            headerName: 'Nome',
            minWidth: 180,
            flex: 2,
            renderCell: (params: GridRenderCellParams<ParticipantDto>) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <PersonOutline fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>{params.value}</Typography>
                </Box>
            ),
        },
        {
            field: 'pixKey',
            headerName: 'Chave Pix',
            minWidth: 200,
            flex: 1.5,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ParticipantDto>) => (
                params.value
                    ? (
                        <Tooltip title="Copiar chave Pix">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(params.value)
                                        .then(() => toastManager.success('Chave Pix copiada!'))
                                        .catch(() => toastManager.error('Não foi possível copiar.'));
                                }}
                            >
                                <ContentCopy fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )
                    : <Typography variant="body2" color="text.secondary">—</Typography>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Status',
            minWidth: 110,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ParticipantDto>) => (
                params.value
                    ? <Chip label="Ativo" color="success" size="small" variant="outlined" />
                    : <Chip label="Inativo" color="default" size="small" />
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Adicionado em',
            minWidth: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ParticipantDto>) => formatarDataHoraTela(params.value),
        },
        {
            field: 'actions',
            headerName: 'Ações',
            minWidth: 170,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ParticipantDto>) => {
                if (!canManage) return null;
                const row = params.row;
                const actions = [
                    {
                        label: 'Editar',
                        icon: <PersonOutline color="success" />,
                        disabled: eventClosed,
                        tooltip: eventClosed ? 'Evento encerrado' : 'Editar participante',
                        onClick: () => {
                            setEditing(row);
                            setFormOpen(true);
                        },
                    },
                    {
                        label: 'Novo link',
                        icon: <Key color="info" />,
                        disabled: eventClosed,
                        tooltip: eventClosed ? 'Evento encerrado' : 'Gerar novo token de acesso',
                        onClick: () => handleRotateToken(row),
                    },
                    row.isActive
                        ? {
                            label: 'Desativar',
                            icon: <PersonOff color="error" />,
                            disabled: eventClosed,
                            tooltip: eventClosed ? 'Evento encerrado' : 'Desativar participante',
                            onClick: () => handleToggleActive(row),
                        }
                        : {
                            label: 'Reativar',
                            icon: <PersonAdd color="success" />,
                            onClick: () => handleToggleActive(row),
                        },
                ];
                return <ActionButtons params={params} actions={actions} />;
            },
        },
    ]), [canManage, eventClosed, handleRotateToken, handleToggleActive]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!canManage && (
                <Alert severity="info">
                    Você está visualizando os participantes. Apenas administradores do evento podem alterá-los.
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPagination((p) => ({ ...p, currentPage: 1 }));
                    }}
                    sx={{ minWidth: 260 }}
                />

                <Box sx={{ flexGrow: 1 }} />

                {canManage && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        disabled={eventClosed}
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        Novo participante
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
                getRowId={(row: ParticipantDto) => row.id}
                disableColumnFilter
                disableColumnSorting
            />

            <ParticipantFormDialog
                open={formOpen}
                eventId={eventId}
                participant={editing}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
                onSaved={(created) => {
                    setFormOpen(false);
                    setEditing(null);
                    refresh();
                    // Token cru só existe na criação — exibe uma única vez.
                    if (created) {
                        setTokenDialog({ name: created.participant.name, token: created.accessToken });
                    }
                }}
            />

            <ParticipantTokenDialog
                open={!!tokenDialog}
                eventId={eventId}
                name={tokenDialog?.name ?? ''}
                token={tokenDialog?.token ?? ''}
                onClose={() => setTokenDialog(null)}
            />
        </Box>
    );
};

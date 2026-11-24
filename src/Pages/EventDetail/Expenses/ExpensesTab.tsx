import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { PersonalizedDataGrid } from '../../../Components/PersonalizedDataGrid';
import { ActionButtons } from '../../../Components/PersonalizedDataGrid/ActionButtons';
import { withDefaultColumns } from '../../../Services/PersonalizedDataGrid';
import { ExpensesService } from '../../../Services/Api/Expenses/ExpensesService';
import { ExpenseDto } from '../../../Services/Api/Types';
import { toApiError } from '../../../Services/Api/Errors';
import { toastManager } from '../../../Services/ToastUtils';
import { formatarDataTela, formatarMoeda } from '../../../Services/Formatters';
import { useConfirm } from '../../../Contexts/ConfirmDialogContext';
import { getTablePagination } from '../../../Services/PersonalizedDataGrid/tableConfig';
import { IPagination } from '../../../Services/Api/Utils';
import { ExpenseFormDialog } from './Form/ExpenseFormDialog';

interface ExpensesTabProps {
    eventId: string;
    canManage: boolean;
    canRegister: boolean;
    eventClosed: boolean;
}

const TABLE_ID = 'event-expenses';

/** Rótulos dos tipos de divisão (enums serializados em camelCase). */
const SPLIT_LABELS: Record<string, string> = {
    equal: 'Igual',
    fixed: 'Valores fixos',
    percentage: 'Percentual',
    remaining: 'Restante',
};

export const ExpensesTab = ({ eventId, canManage, canRegister, eventClosed }: ExpensesTabProps) => {
    const confirm = useConfirm();

    const [rows, setRows] = useState<ExpenseDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState<IPagination>(() => getTablePagination(TABLE_ID));
    const [reloadKey, setReloadKey] = useState(0);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ExpenseDto | null>(null);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const timer = setTimeout(() => {
            ExpensesService.List(eventId, {
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
                    console.error('Erro ao carregar despesas:', toApiError(error));
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

    const canEditExpense = useCallback((row: ExpenseDto) => (
        !eventClosed && (canManage || row.permissions.canEdit)
    ), [eventClosed, canManage]);

    const handleDelete = useCallback((row: ExpenseDto) => {
        confirm({
            titulo: 'Excluir despesa',
            conteudo: `Excluir "${row.description}" (${formatarMoeda(row.totalAmountInCents / 100)})? Os saldos serão recalculados.`,
            textBtnConfirmar: 'Excluir',
            corBtnConfirmar: 'error',
            onConfirm: async ({ close, setLoading: setDlgLoading }) => {
                setDlgLoading(true);
                try {
                    await ExpensesService.Remove(eventId, row.id);
                    toastManager.success('Despesa excluída.');
                    refresh();
                } catch (error) {
                    // 403 expense.edit_forbidden, 404 expense.not_found, 409 event.closed
                    toastManager.error(toApiError(error).message);
                } finally {
                    close();
                }
            },
        });
    }, [confirm, eventId, refresh]);

    const columns = useMemo<GridColDef[]>(() => withDefaultColumns([
        {
            field: 'description',
            headerName: 'Descrição',
            minWidth: 200,
            flex: 2,
            renderCell: (params: GridRenderCellParams<ExpenseDto>) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {params.row.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        Pago por {params.row.paidByParticipantName}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'totalAmountInCents',
            headerName: 'Valor',
            minWidth: 120,
            align: 'right',
            headerAlign: 'right',
            sortable: false,
            renderCell: (params: GridRenderCellParams<ExpenseDto>) => (
                <Typography variant="body2" fontWeight={600}>
                    {formatarMoeda(params.value / 100)}
                </Typography>
            ),
        },
        {
            field: 'date',
            headerName: 'Data',
            minWidth: 110,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ExpenseDto>) => formatarDataTela(params.value),
        },
        {
            field: 'splitType',
            headerName: 'Divisão',
            minWidth: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ExpenseDto>) => (
                <Chip label={SPLIT_LABELS[params.value] ?? params.value} size="small" variant="outlined" />
            ),
        },
        {
            field: 'shares',
            headerName: 'Participantes',
            minWidth: 90,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ExpenseDto>) => (
                <Chip label={params.value?.length ?? 0} size="small" />
            ),
        },
        {
            field: 'actions',
            headerName: 'Ações',
            minWidth: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams<ExpenseDto>) => {
                const editable = canEditExpense(params.row);
                const deletable = !eventClosed && (canManage || params.row.permissions.canDelete);
                if (!editable && !deletable) return null;

                return (
                    <ActionButtons
                        params={params}
                        actions={[
                            ...(editable ? [{
                                label: 'Editar',
                                icon: <Edit color="success" />,
                                onClick: () => {
                                    setEditing(params.row);
                                    setFormOpen(true);
                                },
                            }] : []),
                            ...(deletable ? [{
                                label: 'Excluir',
                                icon: <Delete color="error" />,
                                onClick: () => handleDelete(params.row),
                            }] : []),
                        ]}
                    />
                );
            },
        },
    ]), [canManage, eventClosed, canEditExpense, handleDelete]);

    const canCreate = canRegister && !eventClosed;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {eventClosed && (
                <Alert severity="info">
                    Este evento está encerrado — as despesas são somente para consulta.
                </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    size="small"
                    placeholder="Buscar por descrição..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPagination((p) => ({ ...p, currentPage: 1 }));
                    }}
                    sx={{ minWidth: 260 }}
                />

                <Box sx={{ flexGrow: 1 }} />

                {canCreate && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        Nova despesa
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
                getRowId={(row: ExpenseDto) => row.id}
                disableColumnFilter
                disableColumnSorting
            />

            <ExpenseFormDialog
                open={formOpen}
                eventId={eventId}
                expense={editing}
                onClose={() => {
                    setFormOpen(false);
                    setEditing(null);
                }}
                onSaved={() => {
                    setFormOpen(false);
                    setEditing(null);
                    refresh();
                }}
            />
        </Box>
    );
};

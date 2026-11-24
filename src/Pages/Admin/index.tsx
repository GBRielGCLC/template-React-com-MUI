import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    Typography,
} from '@mui/material';
import { PersonAdd, PersonOutline } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { PersonalizedDataGrid } from '../../Components/PersonalizedDataGrid';
import { withDefaultColumns } from '../../Services/PersonalizedDataGrid';
import { getTablePagination } from '../../Services/PersonalizedDataGrid/tableConfig';
import { AuthService } from '../../Services/Api/Auth/AuthService';
import { UserDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { formatarDataHoraTela } from '../../Services/Formatters';
import { IPagination } from '../../Services/Api/Utils';
import { useAuth } from '../../Contexts/AuthContext';
import { InviteDialog } from './InviteDialog';

const TABLE_ID = 'admin-users';

/**
 * Administração da plataforma (`/admin`): criar convites de acesso e
 * listar usuários. Exige JWT com `platform_admin=true`
 * (`403 auth.forbidden` para os demais).
 */
export const Admin = () => {
    const navigate = useNavigate();
    const { user, isParticipant, participantEventId } = useAuth();

    const [rows, setRows] = useState<UserDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<IPagination>(() => getTablePagination(TABLE_ID));
    const [reloadKey, setReloadKey] = useState(0);
    const [inviteOpen, setInviteOpen] = useState(false);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    const isPlatformAdmin = !!user?.isPlatformAdmin;

    useEffect(() => {
        if (!isPlatformAdmin) return;

        let cancelled = false;
        setLoading(true);

        AuthService.ListUsers({
            page: pagination.currentPage,
            pageSize: pagination.itensPorPagina,
        })
            .then((result) => {
                if (cancelled) return;
                setRows(result.items);
                setTotalItems(result.totalItems);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Erro ao carregar usuários:', toApiError(error));
                setRows([]);
                setTotalItems(0);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isPlatformAdmin, pagination, reloadKey]);

    const columns = buildColumns();

    if (!isPlatformAdmin) {
        const backTo = isParticipant && participantEventId
            ? `/events/${participantEventId}`
            : '/events';
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                <Alert severity="warning">
                    Você não tem permissão para acessar a administração da plataforma.
                </Alert>
                <Button onClick={() => navigate(backTo)}>Voltar</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="h4" fontWeight={600}>
                        Administração
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Convites de acesso e usuários da plataforma.
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => setInviteOpen(true)}
                >
                    Novo convite
                </Button>
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
                getRowId={(row: UserDto) => row.id}
                disableColumnFilter
                disableColumnSorting
            />

            <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
        </Box>
    );
};

/** Colunas da lista de usuários. */
function buildColumns(): GridColDef[] {
    return withDefaultColumns([
        {
            field: 'displayName',
            headerName: 'Nome',
            minWidth: 220,
            flex: 2,
            renderCell: (params: GridRenderCellParams<UserDto>) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <PersonOutline fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>{params.value}</Typography>
                </Box>
            ),
        },
        {
            field: 'email',
            headerName: 'E-mail',
            minWidth: 240,
            flex: 1.5,
            sortable: false,
            renderCell: (params: GridRenderCellParams<UserDto>) => (
                <Typography variant="body2" noWrap>{params.value}</Typography>
            ),
        },
        {
            field: 'isPlatformAdmin',
            headerName: 'Perfil',
            minWidth: 130,
            sortable: false,
            renderCell: (params: GridRenderCellParams<UserDto>) => (
                params.value
                    ? <Chip label="Admin" color="primary" size="small" variant="outlined" />
                    : <Chip label="Comum" color="default" size="small" variant="outlined" />
            ),
        },
        {
            field: 'createdAt',
            headerName: 'Criado em',
            minWidth: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams<UserDto>) => formatarDataHoraTela(params.value),
        },
    ]);
}

import { useCallback, useEffect, useState } from 'react';
import { GridSortModel } from '@mui/x-data-grid';
import { EventsService } from '../../Services/Api/Events/EventsService';
import { EventListItemDto } from '../../Services/Api/Types';
import { IPagination } from '../../Services/Api/Utils';
import { getTablePagination } from '../../Services/PersonalizedDataGrid/tableConfig';
import { toApiError } from '../../Services/Api/Errors';

const TABLE_ID = 'events';

/**
 * Converte o sortModel do DataGrid no `sort` da API.
 * A API aceita `name`, `createdAt`, `updatedAt` (com `-` = desc) e
 * faz trim/lowercase — então `updatedAt desc` → `-updatedat`.
 */
const sortModelToApi = (sortModel: GridSortModel): string | undefined => {
    const first = sortModel[0];
    if (!first?.field || !first.sort) return undefined;
    return `${first.sort === 'desc' ? '-' : ''}${first.field.toLowerCase()}`;
};

export const useEvents = () => {
    // Paginação inicial lida do mesmo localStorage que a DataGrid persiste.
    const [pagination, setPagination] = useState<IPagination>(() => getTablePagination(TABLE_ID));
    const [sortModel, setSortModel] = useState<GridSortModel>([
        { field: 'updatedAt', sort: 'desc' },
    ]);

    const [rows, setRows] = useState<EventListItemDto[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        EventsService.List({
            page: pagination.currentPage,
            pageSize: pagination.itensPorPagina,
            sort: sortModelToApi(sortModel),
        })
            .then((result) => {
                if (cancelled) return;
                setRows(result.items);
                setTotalItems(result.totalItems);
            })
            .catch((error) => {
                if (cancelled) return;
                // Erros já são tratados/toastados pelo interceptor; limpa a lista.
                console.error('Erro ao carregar eventos:', toApiError(error));
                setRows([]);
                setTotalItems(0);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [pagination, sortModel, reloadKey]);

    return {
        rows,
        totalItems,
        loading,
        pagination,
        setPagination,
        sortModel,
        setSortModel,
        refresh,
        tableId: TABLE_ID,
    };
};

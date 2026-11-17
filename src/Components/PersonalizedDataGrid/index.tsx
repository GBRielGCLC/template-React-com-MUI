import {
    DataGrid,
    DataGridProps,
    GridPaginationModel,
    GridCallbackDetails,
    GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { ptBR as gridPtBR } from '@mui/x-data-grid/locales';
import { NoResultsCustom, NoRowsCustom } from './CustomOverlays';
import { CustomToolbar } from './CustomToolbar';
import { defaultPaginationsData, IPagination } from '../../Services/Api/Utils';
import { ReactNode, useCallback, useEffect } from 'react';
import { loadTableConfig, saveTableConfig } from '../../Services/PersonalizedDataGrid/tableConfig';
import { useTheme } from '@mui/material';

const modelToPagination = (model: GridPaginationModel): IPagination => ({
    currentPage: model.page + 1,
    itensPorPagina: model.pageSize,
});

const localeText: DataGridProps['localeText'] = {
    ...gridPtBR.components.MuiDataGrid.defaultProps.localeText,
    toolbarQuickFilterLabel: 'Filtro Rápido',
    paginationDisplayedRows: ({ from, to, count }) => `${from} - ${to} de ${count}`,
};

interface PersonalizedDataGridProps extends DataGridProps {
    totalItems?: number;
    onPaginate?(pagination: IPagination): IPagination
    onRefresh?: () => void;
    onClickFilter?: () => void
    toolbarLeftContent?: ReactNode;
    tableId?: string;
    onPagination?(pagination: IPagination): void;
    defaultColumnVisibility?: GridColumnVisibilityModel;
}
export const PersonalizedDataGrid = ({
    paginationMode = 'server',
    tableId,
    ...props
}: PersonalizedDataGridProps) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { onPaginationModelChange, onColumnVisibilityModelChange, onPagination, paginationModel: paginationModelProp, slots: slotsProp, slotProps: slotPropsProp, toolbarLeftContent, onRefresh, onClickFilter, totalItems, ...rest } = props;
    const isServerPagination = paginationMode === 'server';

    const savedConfig = tableId ? loadTableConfig(tableId) : {};
    const savedPage = savedConfig?.page ?? 0;
    const savedPageSize = savedConfig?.pageSize ?? defaultPaginationsData.itensPorPagina;
    const savedColumnVisibility = savedConfig?.columnVisibilityModel;

    useEffect(() => {
        if (tableId && paginationModelProp) {
            const target: GridPaginationModel = {
                page: savedPage,
                pageSize: savedPageSize,
            };
            if (target.page !== paginationModelProp.page || target.pageSize !== paginationModelProp.pageSize) {
                onPaginationModelChange?.(target, {} as GridCallbackDetails);
                onPagination?.(modelToPagination(target));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const serverPaginationProps = isServerPagination
        ? { paginationMode: 'server' as const, rowCount: totalItems ?? 0 }
        : {};

    const handlePaginationModelChange = useCallback((model: GridPaginationModel, details: GridCallbackDetails) => {
        if (tableId) {
            saveTableConfig(tableId, { pageSize: model.pageSize, page: model.page });
        }
        onPagination?.(modelToPagination(model));
        onPaginationModelChange?.(model, details);
    }, [tableId, onPaginationModelChange, onPagination]);

    const handleColumnVisibilityModelChange = useCallback((model: GridColumnVisibilityModel, details: GridCallbackDetails) => {
        if (tableId) {
            saveTableConfig(tableId, { columnVisibilityModel: model });
        }
        onColumnVisibilityModelChange?.(model, details);
    }, [tableId, onColumnVisibilityModelChange]);

    const customInitialState: DataGridProps['initialState'] = {
        pagination: { paginationModel: { page: savedPage, pageSize: savedPageSize } },
    };
    if (savedColumnVisibility) {
        customInitialState.columns = { columnVisibilityModel: savedColumnVisibility };
    } else if (props.defaultColumnVisibility) {
        customInitialState.columns = { columnVisibilityModel: props.defaultColumnVisibility };
    }

    return (
        <DataGrid
            {...rest}
            {...serverPaginationProps}
            localeText={localeText}

            showToolbar
            slots={{
                ...slotsProp,
                toolbar: CustomToolbar,
                noRowsOverlay: NoRowsCustom,
                noResultsOverlay: NoResultsCustom,
            }}
            slotProps={{
                ...slotPropsProp,
                toolbar: {
                    csvOptions: { disableToolbarButton: true },
                    onRefresh,
                    isLoading: !!rest.loading,
                    onClickFilter,
                    leftContent: toolbarLeftContent,
                    ...(slotPropsProp?.toolbar as object ?? {}),
                } as any,
                filterPanel: {
                    sx: {
                        '& .MuiDataGrid-filterForm': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            pb: 1,
                        },
                        '& .MuiFormControl-root': {
                            marginTop: 0,
                            marginBottom: 0,
                        },
                    },
                }
            }}
            ignoreDiacritics

            disableRowSelectionOnClick

            autoHeight
            getRowHeight={() => 'auto'}
            sx={{
                '--DataGrid-rowBorderColor': isDark ? '#242424' : '#e2e8f0',
                '& .MuiDataGrid-columnHeaders': {
                    bgcolor: '#0077a5',
                    borderBottom: '1px solid #006489',
                    minHeight: '44px !important',
                    maxHeight: '44px !important',
                },
                '& .MuiDataGrid-columnHeader': {
                    bgcolor: 'transparent',
                    px: 2,
                    py: 0,
                    height: '44px !important',
                    '&:focus, &:focus-within': { outline: 'none' },
                    '& .MuiDataGrid-columnHeaderTitle': {
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                    },
                    '& .MuiDataGrid-sortIcon': { color: '#ffffff', opacity: 1 },
                    '& .MuiDataGrid-menuIcon': { color: '#ffffff', opacity: 0.7 },
                },
                '& .MuiDataGrid-columnSeparator': {
                    color: 'rgba(255,255,255,0.18)',
                    opacity: 1,
                },
                '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1.1,
                    fontSize: '0.875rem',
                    color: isDark ? '#e2e8f0' : '#0f172a',
                    borderBottom: `1px solid ${isDark ? '#242424' : '#e2e8f0'}`,
                    '&:focus, &:focus-within': { outline: 'none' },
                },
                '& .MuiDataGrid-row': {
                    bgcolor: isDark ? 'transparent' : '#ffffff',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                        bgcolor: isDark ? '#242424 !important' : '#f8fafc !important',
                    },
                    '&.Mui-selected': {
                        bgcolor: isDark ? 'rgba(0,119,165,0.12) !important' : '#eff6ff !important',
                        '&:hover': {
                            bgcolor: isDark ? 'rgba(0,119,165,0.18) !important' : '#dbeafe !important',
                        },
                    },
                },
            }}

            initialState={customInitialState}
            pageSizeOptions={[1, 5, 10, 20, 50, 100]}

            paginationModel={paginationModelProp ? { ...paginationModelProp, pageSize: savedPageSize } : undefined}
            onPaginationModelChange={handlePaginationModelChange}
            onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
        />
    );
};
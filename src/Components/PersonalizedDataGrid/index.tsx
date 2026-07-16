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
import { GridToolbarProps } from '@mui/x-data-grid/internals';
import { defaultPaginationsData, IPagination } from '../../Services/Api/Utils';
import { ReactNode, useCallback, useEffect } from 'react';
import { loadTableConfig, saveTableConfig } from '../../Services/PersonalizedDataGrid/tableConfig';

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
    const { onPaginationModelChange, onColumnVisibilityModelChange, onPagination, paginationModel: paginationModelProp } = props;
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
        ? { paginationMode: 'server' as const, rowCount: props.totalItems ?? 0 }
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

    const renderCustomToolbar = (toolbarProps: GridToolbarProps) => (
        <CustomToolbar
            {...toolbarProps}
            onRefresh={props.onRefresh}
            isLoading={!!props.loading}
            onClickFilter={props.onClickFilter}

            leftContent={props.toolbarLeftContent}
        />
    );

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
            localeText={localeText}

            showToolbar
            slots={{
                toolbar: renderCustomToolbar,
                noRowsOverlay: NoRowsCustom,
                noResultsOverlay: NoResultsCustom,
            }}
            slotProps={{
                toolbar: {
                    csvOptions: { disableToolbarButton: true },

                },
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

            showCellVerticalBorder
            showColumnVerticalBorder

            disableRowSelectionOnClick

            getRowHeight={() => 'auto'}
            sx={{
                '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                },
            }}

            initialState={customInitialState}
            pageSizeOptions={[1, 5, 10, 20, 50, 100]}

            {...serverPaginationProps}

            {...props}
            paginationModel={paginationModelProp ? { ...paginationModelProp, pageSize: savedPageSize } : undefined}
            onPaginationModelChange={handlePaginationModelChange}
            onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
        />
    );
};

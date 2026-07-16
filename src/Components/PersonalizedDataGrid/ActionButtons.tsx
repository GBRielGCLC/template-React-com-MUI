import { Edit, Delete } from '@mui/icons-material';
import { GridActionsCell, GridActionsCellItem, GridRenderCellParams } from '@mui/x-data-grid';
import React from 'react';

export interface ActionButtonsProps<T> extends React.PropsWithChildren {
    params: GridRenderCellParams<any, T>;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
}

export const ActionButtons = <T,>({
    params,
    onEdit,
    onDelete,
    children,
}: ActionButtonsProps<T>) => {
    const row = params.row;

    return (
        <GridActionsCell {...params}>
            {onEdit && <GridActionsCellItem
                onClick={(event) => {
                    event.stopPropagation();
                    onEdit(row);
                }}
                label="Editar"
                icon={<Edit color='success' />}
            />}

            {onDelete && <GridActionsCellItem
                label="Deletar"
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete(row);
                }}
                icon={<Delete color="error" />}
            />}

            {children}
        </GridActionsCell>
    );
};

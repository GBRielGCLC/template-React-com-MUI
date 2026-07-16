import { GridColDef } from '@mui/x-data-grid';

const defaultColumnProps: Partial<GridColDef> = {
    align: 'center',
    headerAlign: 'center',
    flex: 1,
};

export const withDefaultColumns = (columns: GridColDef[]): GridColDef[] => {
    return columns.map((col) => ({
        ...defaultColumnProps,
        ...col,
    }));
};

import { defaultPaginationsData, IPagination } from "../Api/Utils";

export interface TableConfig {
    pageSize: number;
    page: number;
    columnVisibilityModel: Record<string, boolean>;
}

const STORAGE_KEY = 'tablesConfig';

export function loadTableConfig(tableId: string): Partial<TableConfig> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const all = JSON.parse(raw);
            return all[tableId] ?? {};
        }
    } catch { }
    return {};
}

export function saveTableConfig(tableId: string, config: Partial<TableConfig>): void {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : {};
        all[tableId] = { ...all[tableId], ...config };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { }
}

export function getTablePagination(tableId: string): IPagination {
    const savedConfig = loadTableConfig(tableId);
    return {
        currentPage: (savedConfig.page ?? 0) + 1,
        itensPorPagina: savedConfig.pageSize ?? defaultPaginationsData.itensPorPagina,
    };
}

export interface BaseApiResponse<T> {
    items: T[],
    totalItems: number,
    totalPages: number,
    currentPage?: number,
    itemsPerPage?: number,
}

export interface IPagination {
    currentPage: number,
    itensPorPagina: number,
}
export const defaultPaginationsData: IPagination = {
    currentPage: 1,
    itensPorPagina: 10
}

export function queryToString(filters?: Record<string, any>): string {
    if (!filters) return "";

    const params = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");

    return params ? `?${params}` : "";
}

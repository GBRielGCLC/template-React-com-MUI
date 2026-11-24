import { Api } from '../Axios-Config';
import { AuditLogDto, PagedResult } from '../Types';

/** Query de `GET /events/{eventId}/audit` — sem `search`/`sort` (ordem fixa). */
export interface AuditListQuery {
    page?: number;
    /** 1..100 (default do servidor: 50). */
    pageSize?: number;
}

/**
 * Trilha de auditoria do evento (`/api/v1/events/{eventId}/audit`).
 * Exige admin do evento (o `EventDto.permissions.readAudit` indica o acesso).
 */
export const AuditService = {
    /** `GET /events/{eventId}/audit` — mais recente primeiro; default `pageSize` 50. */
    List: async (eventId: string, query: AuditListQuery = {}): Promise<PagedResult<AuditLogDto>> => {
        const response = await Api.get<PagedResult<AuditLogDto>>(`/events/${eventId}/audit`, { params: query });
        return response.data;
    },
};

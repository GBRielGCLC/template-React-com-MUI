import { Api } from '../Axios-Config';
import {
    CreateEventRequest,
    EventAdminDto,
    EventDto,
    EventListItemDto,
    EventListQuery,
    PagedResult,
    PublicLinkDto,
    UpdateEventRequest,
} from '../Types';

/**
 * Endpoints de eventos (`/api/v1/events`).
 * Todos exigem JWT exceto `Get` (aceita também token de participante).
 * Ações de admin (update/close/reopen/public-link/admins) exigem
 * `permissions.manageEvent` — a API responde `403 event.admin_required`.
 */
export const EventsService = {
    /** `GET /events` — só usuário logado (`403 event.user_required` com PT). */
    List: async (query: EventListQuery = {}): Promise<PagedResult<EventListItemDto>> => {
        const response = await Api.get<PagedResult<EventListItemDto>>('/events', { params: query });
        return response.data;
    },

    /** `GET /events/{eventId}` — JWT ou token de participante. */
    Get: async (eventId: string): Promise<EventDto> => {
        const response = await Api.get<EventDto>(`/events/${eventId}`);
        return response.data;
    },

    /** `POST /events` — retorna 201 com `Location`. */
    Create: async (data: CreateEventRequest): Promise<EventDto> => {
        const response = await Api.post<EventDto>('/events', data);
        return response.data;
    },

    /** `PATCH /events/{eventId}` — parcial; omitido/`null` = mantém. */
    Update: async (eventId: string, data: UpdateEventRequest): Promise<EventDto> => {
        const response = await Api.patch<EventDto>(`/events/${eventId}`, data);
        return response.data;
    },

    /** `POST /events/{eventId}/close` — `422 event.pending_payments` se houver pendentes. */
    Close: async (eventId: string): Promise<EventDto> => {
        const response = await Api.post<EventDto>(`/events/${eventId}/close`);
        return response.data;
    },

    /** `POST /events/{eventId}/reopen` — `409 event.not_closed` se já estiver aberto. */
    Reopen: async (eventId: string): Promise<EventDto> => {
        const response = await Api.post<EventDto>(`/events/${eventId}/reopen`);
        return response.data;
    },

    // --- Link público ---

    /** `POST /events/{eventId}/public-link` — habilita (ou rotaciona se já habilitado). */
    EnablePublicLink: async (eventId: string): Promise<PublicLinkDto> => {
        const response = await Api.post<PublicLinkDto>(`/events/${eventId}/public-link`);
        return response.data;
    },

    /** `DELETE /events/{eventId}/public-link` — 204. */
    DisablePublicLink: async (eventId: string): Promise<void> => {
        await Api.delete(`/events/${eventId}/public-link`);
    },

    // --- Admins do evento (não paginado) ---

    ListAdmins: async (eventId: string): Promise<EventAdminDto[]> => {
        const response = await Api.get<EventAdminDto[]>(`/events/${eventId}/admins`);
        return response.data;
    },

    /** `POST /events/{eventId}/admins` — o usuário já precisa existir no Quitta. */
    AddAdmin: async (eventId: string, email: string): Promise<EventAdminDto> => {
        const response = await Api.post<EventAdminDto>(`/events/${eventId}/admins`, { email });
        return response.data;
    },

    RemoveAdmin: async (eventId: string, userId: string): Promise<void> => {
        await Api.delete(`/events/${eventId}/admins/${userId}`);
    },
};

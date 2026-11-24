import { Api } from '../Axios-Config';
import {
    CreateParticipantRequest,
    ParticipantCreatedDto,
    ParticipantDto,
    ParticipantListQuery,
    ParticipantMeDto,
    ParticipantTokenDto,
    PagedResult,
    UpdateParticipantRequest,
} from '../Types';

/**
 * Participantes de um evento (`/api/v1/events/{eventId}/participants`).
 * Leitura: JWT ou token de participante; escrita: admin do evento.
 */
export const ParticipantsService = {
    /** `GET /` — default `pageSize` 100; `search` por substring do nome. */
    List: async (eventId: string, query: ParticipantListQuery = {}): Promise<PagedResult<ParticipantDto>> => {
        const response = await Api.get<PagedResult<ParticipantDto>>(
            `/events/${eventId}/participants`,
            { params: query },
        );
        return response.data;
    },

    /** `GET /me` — **só** token de participante (`403 participant.token_required` com JWT). */
    Me: async (eventId: string): Promise<ParticipantMeDto> => {
        const response = await Api.get<ParticipantMeDto>(`/events/${eventId}/participants/me`);
        return response.data;
    },

    Get: async (eventId: string, participantId: string): Promise<ParticipantDto> => {
        const response = await Api.get<ParticipantDto>(
            `/events/${eventId}/participants/${participantId}`,
        );
        return response.data;
    },

    /**
     * `POST /` — o `accessToken` cru é devolvido **só aqui** (e na rotação).
     * Exibir uma única vez, com cópia/QR e aviso de que não poderá ser recuperado.
     */
    Create: async (eventId: string, data: CreateParticipantRequest): Promise<ParticipantCreatedDto> => {
        const response = await Api.post<ParticipantCreatedDto>(
            `/events/${eventId}/participants`,
            data,
        );
        return response.data;
    },

    /** `PATCH /{id}` — parcial; `clearPixKey: true` zera a chave Pix. */
    Update: async (
        eventId: string,
        participantId: string,
        data: UpdateParticipantRequest,
    ): Promise<ParticipantDto> => {
        const response = await Api.patch<ParticipantDto>(
            `/events/${eventId}/participants/${participantId}`,
            data,
        );
        return response.data;
    },

    /** `DELETE /{id}` — 204. `422 participant.open_balance` se tiver saldo. */
    Deactivate: async (eventId: string, participantId: string): Promise<void> => {
        await Api.delete(`/events/${eventId}/participants/${participantId}`);
    },

    /** `POST /{id}/reactivate` — `409 participant.already_active` se já ativo. */
    Reactivate: async (eventId: string, participantId: string): Promise<ParticipantDto> => {
        const response = await Api.post<ParticipantDto>(
            `/events/${eventId}/participants/${participantId}/reactivate`,
        );
        return response.data;
    },

    /**
     * `POST /{id}/access-token` — rotaciona o token; o novo valor cru é
     * devolvido **só aqui** (invalida o anterior).
     */
    RotateAccessToken: async (eventId: string, participantId: string): Promise<ParticipantTokenDto> => {
        const response = await Api.post<ParticipantTokenDto>(
            `/events/${eventId}/participants/${participantId}/access-token`,
        );
        return response.data;
    },
};

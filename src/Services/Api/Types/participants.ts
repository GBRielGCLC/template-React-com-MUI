import { PageQuery } from './common';

/** Corpo de `POST /events/{id}/participants`. */
export interface CreateParticipantRequest {
    name: string;
    /** ≤140, texto puro. */
    pixKey?: string | null;
}

/** Corpo de `PATCH /participants/{id}` — parcial. */
export interface UpdateParticipantRequest {
    name?: string | null;
    pixKey?: string | null;
    /** `true` zera a chave Pix; exclusivo com `pixKey`. */
    clearPixKey?: boolean;
}

export interface ParticipantDto {
    id: string;
    name: string;
    /** Texto puro — só é devolvido para quem tem acesso de leitura. */
    pixKey: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Resposta de `POST /participants` — o `accessToken` cru **só é devolvido
 * aqui** (e na rotação). Exibir uma única vez, com aviso de não recuperação.
 */
export interface ParticipantCreatedDto {
    participant: ParticipantDto;
    accessToken: string;
}

/** Resposta de `POST /participants/{id}/access-token` (rotação). */
export interface ParticipantTokenDto {
    participantId: string;
    accessToken: string;
}

/** Corpo de `GET /participants/me` (só token de participante). */
export interface ParticipantMeDto {
    participant: ParticipantDto;
    balance: ParticipantBalanceDto | null;
}

/**
 * Saldo do participante autenticado. Os campos exatos não estão detalhados
 * no contrato — confirmar com o back antes de depender deles.
 */
export interface ParticipantBalanceDto {
    paidCents?: number;
    owedCents?: number;
    netCents?: number;
    [key: string]: unknown;
}

export interface ParticipantListQuery extends PageQuery {
    /** Substring case-insensitive no `name`. */
    search?: string;
    includeInactive?: boolean;
    /** `name` | `-name` | `createdat` | `-createdat` (default `name`). */
    sort?: string;
}

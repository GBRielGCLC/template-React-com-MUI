import { EventStatus, PageQuery } from './common';

/** Corpo de `POST /events`. */
export interface CreateEventRequest {
    name: string;
    description?: string | null;
    /** default `true`. */
    requirePaymentConfirmation?: boolean;
}

/** Corpo de `PATCH /events/{id}` — parcial; omitido/`null` = mantém. */
export interface UpdateEventRequest {
    name?: string | null;
    description?: string | null;
    requirePaymentConfirmation?: boolean;
    /** `true` zera a descrição; exclusivo com `description`. */
    clearDescription?: boolean;
}

/**
 * Permissões de **quem chamou** o endpoint. Para participante, apenas
 * `registerExpenses` vem `true`. Use para esconder botões na UI.
 */
export interface EventPermissions {
    manageEvent: boolean;
    manageParticipants: boolean;
    manageExpenses: boolean;
    confirmPayments: boolean;
    readAudit: boolean;
    registerExpenses: boolean;
}

export interface EventDto {
    id: string;
    name: string;
    description: string | null;
    currency: string;
    status: EventStatus;
    requirePaymentConfirmation: boolean;
    publicLinkEnabled: boolean;
    /** Incrementa a cada mudança (usado com SignalR para detectar tela desatualizada). */
    changeVersion: number;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    permissions: EventPermissions;
}

/** Sem `currency`, `publicLinkEnabled` e `permissions`. */
export interface EventListItemDto {
    id: string;
    name: string;
    description: string | null;
    status: EventStatus;
    requirePaymentConfirmation: boolean;
    changeVersion: number;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}

export interface EventListQuery extends PageQuery {
    /** `updatedat` | `-updatedat` | `createdat` | `-createdat` | `name` | `-name` (default `-updatedat`). */
    sort?: string;
}

export interface EventAdminDto {
    userId: string;
    email: string;
    /** `"(usuário removido)"` se o usuário saiu. */
    displayName: string;
    isOwner: boolean;
    grantedAt: string;
}

/** Resposta de enable/rotate do link público. Montar a URL pública com `path`. */
export interface PublicLinkDto {
    token: string;
    path: string;
}

/** Corpo de `GET /events/{id}/audit` (sem search/sort; mais recente primeiro). */
export interface AuditLogDto {
    id: number;
    action: string;
    entityType: string;
    entityId?: string | null;
    actorType: 'user' | 'participant' | 'system';
    actorUserId?: string | null;
    actorParticipantId?: string | null;
    correlationId?: string | null;
    occurredAt: string;
    data: Record<string, unknown> | null;
}

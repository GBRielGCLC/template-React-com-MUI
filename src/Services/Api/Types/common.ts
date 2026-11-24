/** Tipos comuns usados em todos os endpoints da API Quitta. */

/** Envelope de resposta de qualquer endpoint de lista. */
export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

/** Query params de paginação/ordenação aceitos por todos os endpoints de lista. */
export interface PageQuery {
    page?: number;
    /** 1..100 */
    pageSize?: number;
    /** Prefixo `-` = desc (valores válidos variam por recurso). */
    sort?: string;
}

export type EventStatus = 'active' | 'closed';
export type PaymentStatus = 'informed' | 'confirmed' | 'rejected';
export type SplitType = 'equal' | 'fixed' | 'percentage' | 'remaining';
export type ActorType = 'user' | 'participant' | 'system';

/**
 * Envelope de erro `application/problem+json` retornado pela API.
 * `code` é a chave para tratamento programático; `errors` é para exibição por campo.
 */
export interface ProblemDetails {
    type?: string | null;
    status: number;
    title?: string;
    detail?: string;
    instance?: string;
    code?: string;
    traceId?: string;
    errors?: Record<string, string[]>;
}

import { AxiosError } from 'axios';
import { ProblemDetails } from './Types';

/**
 * Erro padronizado de qualquer chamada à API. Envolve o envelope
 * `application/problem+json` e expõe `code` (chave para tratamento
 * programático), `detail` (mensagem pt-BR) e `errors` (por campo).
 */
export class ApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly title?: string;
    readonly detail?: string;
    readonly instance?: string;
    readonly traceId?: string;
    /** Campo → mensagens (para exibir em formulários). */
    readonly errors?: Record<string, string[]>;

    constructor(params: {
        status: number;
        code?: string;
        title?: string;
        detail?: string;
        instance?: string;
        traceId?: string;
        errors?: Record<string, string[]>;
        message?: string;
    }) {
        super(params.message ?? params.detail ?? params.title ?? `Erro ${params.status}`);
        this.name = 'ApiError';
        this.status = params.status;
        this.code = params.code;
        this.title = params.title;
        this.detail = params.detail;
        this.instance = params.instance;
        this.traceId = params.traceId;
        this.errors = params.errors;
    }

    /** Mensagem pronta para exibir ao usuário (detail pt-BR ou fallback). */
    get userMessage(): string {
        return this.detail ?? this.message;
    }

    /** `true` se houver erros por campo (`400 validation.failed`). */
    get isValidation(): boolean {
        return this.code === 'validation.failed' && !!this.errors;
    }

    /**
     * Extrai um `ApiError` de um `AxiosError`. Se a resposta não for
     * `problem+json`, monta um erro genérico com o status.
     */
    static fromAxiosError(error: AxiosError): ApiError {
        const status = error.response?.status ?? 0;
        const data = error.response?.data as ProblemDetails | string | undefined;
        const traceHeader = error.response?.headers?.['x-correlation-id'];

        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return new ApiError({
                status: data.status ?? status,
                code: data.code,
                title: data.title,
                detail: data.detail,
                instance: data.instance,
                traceId: data.traceId ?? (typeof traceHeader === 'string' ? traceHeader : undefined),
                errors: data.errors,
            });
        }

        return new ApiError({
            status,
            detail: typeof data === 'string' && data ? data : undefined,
            traceId: typeof traceHeader === 'string' ? traceHeader : undefined,
            message: status === 0
                ? 'Erro ao se comunicar com o servidor. Verifique sua conexão.'
                : `Erro ${status}`,
        });
    }
}

/** Converte qualquer `throw` em `ApiError` (erros de rede viram status 0). */
export function toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof AxiosError) return ApiError.fromAxiosError(error);
    if (error instanceof Error) return new ApiError({ status: 0, message: error.message });
    return new ApiError({ status: 0, message: 'Erro inesperado' });
}

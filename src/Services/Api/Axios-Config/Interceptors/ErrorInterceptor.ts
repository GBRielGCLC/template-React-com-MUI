import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { ApiError, toApiError } from '../../Errors';
import { refreshSession } from '../../Refresh';
import { TokenStore, forceLogout } from '../../TokenStore';

/** Config do axios marcada para não tentar refresh duas vezes na mesma request. */
interface RetriableConfig extends InternalAxiosRequestConfig {
    _retried?: boolean;
}

const AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/accept-invite'];

function isAuthUrl(url?: string): boolean {
    return AUTH_URLS.some((authUrl) => url?.includes(authUrl));
}

/** Mensagem amigável por código, para erros sem tratamento dedicado em tela. */
function fallbackMessage(error: ApiError, method?: string): string {
    switch (error.code) {
        case 'rate_limit.exceeded':
            return 'Muitas requisições. Aguarde um instante e tente novamente.';
        case 'concurrency.conflict':
            return 'Este registro foi alterado por outra pessoa. Recarregando...';
        case 'event.closed':
            return 'Este evento está encerrado e não aceita mais alterações.';
        case 'event.access_denied':
        case 'event.admin_required':
        case 'event.user_required':
            return 'Você não tem permissão para esta ação.';
    }

    if (error.detail) return error.detail;

    switch (method) {
        case 'get': return 'Erro ao consultar o registro';
        case 'post': return 'Erro ao criar o registro';
        case 'put':
        case 'patch': return 'Erro ao editar o registro';
        case 'delete': return 'Erro ao deletar o registro';
        default: return 'Erro inesperado';
    }
}

/**
 * Interceptor de erro:
 * - `401` fora dos endpoints de auth → renova o token uma vez (fila
 *   compartilhada em `Refresh.ts`) e reenvia a request; se o refresh
 *   falhar, `refreshSession` cuida do logout.
 * - Envelope `problem+json` → `ApiError` com `code`/`detail`/`errors`/`traceId`.
 * - Toast só para erros inesperados (rede, 429, 5xx); validações e regras
 *   de negócio são rejeitadas para a página exibir.
 */
export const errorInterceptor = async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const apiError = toApiError(error);

    // Rede sem resposta.
    if (status === undefined) {
        if (error.message === 'Network Error') {
            return Promise.reject(new ApiError({
                status: 0,
                message: 'Erro ao se comunicar com o servidor, verifique sua conexão com a internet.',
            }));
        }
        return Promise.reject(apiError);
    }

    // 401 em endpoints de auth (login/refresh/accept-invite): erro direto para a tela.
    if (status === 401 && isAuthUrl(config?.url)) {
        return Promise.reject(apiError);
    }

    // 401 fora dos endpoints de auth: tenta refresh uma vez e reenvia.
    if (status === 401 && config && !config._retried && TokenStore.getRefreshToken()) {
        config._retried = true;
        try {
            await refreshSession();
            config.headers.set('Authorization', `Bearer ${TokenStore.getAccessToken()}`);
            // Import dinâmico evita ciclo de imports (index → Interceptors → index).
            const { Api } = await import('../index');
            return Api(config);
        } catch (refreshError) {
            const refreshApiError = toApiError(refreshError);
            // 401 no refresh: `refreshSession` já disparou o logout (que exibe
            // o toast via AuthContext) — evita mensagem duplicada.
            if (refreshApiError.status !== 401) {
                toast.warn(refreshApiError.detail ?? 'Não foi possível renovar a sessão. Tente novamente.');
            }
            return Promise.reject(refreshApiError);
        }
    }

    // 401 sem refresh token: sessão caiu.
    if (status === 401) {
        // Link de participante inválido/rotacionado/desativado: não há como
        // "renovar" o PT — derruba a sessão com motivo claro. (As demais
        // requests paralelas caem no branch de baixo, já sem PT: sem toast.)
        if (TokenStore.getParticipantToken()) {
            forceLogout('Este link de acesso não é mais válido. Peça um novo link ao organizador.');
            return Promise.reject(apiError);
        }
        if (TokenStore.getRefreshToken() || TokenStore.getUser()) {
            toast.warn('Sessão expirada. Faça login novamente.');
        }
        return Promise.reject(apiError);
    }

    // 429: informa o tempo de espera (Retry-After, em segundos).
    if (status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        const seconds = typeof retryAfter === 'string' ? parseInt(retryAfter, 10) : undefined;
        toast.warn(
            Number.isFinite(seconds) && seconds
                ? `Muitas requisições. Tente novamente em ${seconds}s.`
                : 'Muitas requisições. Tente novamente em instantes.',
        );
        return Promise.reject(apiError);
    }

    console.error(
        `${error.config?.method} ${error.config?.url} → ${status}${apiError.code ? ` [${apiError.code}]` : ''}`,
        apiError.traceId ? `traceId: ${apiError.traceId}` : '',
        apiError.errors ?? '',
    );

    // 5xx: toast de erro interno (a página pode exibir o traceId no corpo).
    if (status >= 500) {
        toast.error('Erro interno do servidor. Tente novamente em instantes.');
        return Promise.reject(apiError);
    }

    // Demais (400/403/404/409/422): rejeita com mensagem pronta — a página
    // decide a exibição (errors no formulário, detail em aviso, etc.).
    return Promise.reject(new ApiError({
        status: apiError.status,
        code: apiError.code,
        title: apiError.title,
        detail: apiError.detail,
        instance: apiError.instance,
        traceId: apiError.traceId,
        errors: apiError.errors,
        message: apiError.detail ?? fallbackMessage(apiError, error.config?.method),
    }));
};

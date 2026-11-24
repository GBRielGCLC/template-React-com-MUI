import axios, { AxiosError } from 'axios';
import { TokenStore, forceLogout } from './TokenStore';
import { ApiError } from './Errors';
import { TokenResponse } from './Types';

/**
 * Renova o access token usando o refresh token, com **single-flight**:
 * várias chamadas simultâneas esperam a mesma Promise (fila de requests
 * enquanto renova, conforme recomendado no contrato).
 *
 * - Sucesso: grava os tokens e resolve com o novo `accessToken`.
 * - Falha `401` (`auth.invalid_refresh_token` / `auth.refresh_reused`):
 *   logout forçado (o reuso de refresh revoga **todas** as sessões).
 * - Falha de rede/5xx: rejeita **sem** derrubar a sessão (retry posterior
 *   pode funcionar); o interceptor trata o erro original.
 *
 * Usa uma instância axios sem os interceptores da `Api` para evitar loop.
 */
let refreshPromise: Promise<string> | null = null;

const baseURL =
    process.env.REACT_APP_API_URL ??
    (process.env.NODE_ENV === 'production'
        ? window.location.origin + '/api/v1'
        : 'http://localhost:5000/api/v1');

export function refreshSession(): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

async function doRefresh(): Promise<string> {
    const refreshToken = TokenStore.getRefreshToken();
    if (!refreshToken) {
        forceLogout('Sessão expirada. Faça login novamente.');
        throw new ApiError({ status: 401, code: 'auth.required', detail: 'Sessão expirada. Faça login novamente.' });
    }

    try {
        const response = await axios.post<TokenResponse>(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
        );
        const data = response.data;
        TokenStore.setAccessToken(data.accessToken);
        TokenStore.setRefreshToken(data.refreshToken);
        TokenStore.setUser(data.user);
        return data.accessToken;
    } catch (error) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        if (status === 401) {
            const code = (axiosError.response?.data as { code?: string })?.code;
            forceLogout(
                code === 'auth.refresh_reused'
                    ? 'Sua sessão foi encerrada em outro dispositivo.'
                    : 'Sessão expirada. Faça login novamente.',
            );
            throw ApiError.fromAxiosError(axiosError);
        }

        // Rede ou 5xx: não derruba a sessão — o refresh pode funcionar na próxima.
        throw ApiError.fromAxiosError(axiosError);
    }
}

import { UserDto } from './Types';

/**
 * Armazenamento de sessão.
 *
 * - `accessToken` fica **em memória** (expira em 60 min, é renovado pelo
 *   refresh flow); recarregar a página não o restaura — o primeiro `401`
 *   dispara o refresh silencioso.
 * - `refreshToken` (30 dias) e `user` ficam em `localStorage`.
 * - `participantToken` é opaco, válido para **um evento**, e vai no header
 *   `X-Participant-Token` (não faz parte do refresh flow de usuário).
 */

const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const PARTICIPANT_TOKEN_KEY = 'participantToken';
const PARTICIPANT_EVENT_KEY = 'participantEventId';

let accessToken: string | null = null;

export const TokenStore = {
    getAccessToken: (): string | null => accessToken,

    setAccessToken: (token: string | null): void => {
        accessToken = token;
    },

    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

    setRefreshToken: (token: string | null): void => {
        if (token) {
            localStorage.setItem(REFRESH_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    },

    getUser: (): UserDto | null => {
        const stored = localStorage.getItem(USER_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored) as UserDto;
        } catch {
            localStorage.removeItem(USER_KEY);
            return null;
        }
    },

    setUser: (user: UserDto | null): void => {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_KEY);
        }
    },

    getParticipantToken: (): string | null => sessionStorage.getItem(PARTICIPANT_TOKEN_KEY),

    getParticipantEventId: (): string | null => sessionStorage.getItem(PARTICIPANT_EVENT_KEY),

    setParticipantSession: (eventId: string, token: string | null): void => {
        if (token) {
            sessionStorage.setItem(PARTICIPANT_TOKEN_KEY, token);
            sessionStorage.setItem(PARTICIPANT_EVENT_KEY, eventId);
        } else {
            sessionStorage.removeItem(PARTICIPANT_TOKEN_KEY);
            sessionStorage.removeItem(PARTICIPANT_EVENT_KEY);
        }
    },

    /** Limpa tudo (logout). */
    clear: (): void => {
        accessToken = null;
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(PARTICIPANT_TOKEN_KEY);
        sessionStorage.removeItem(PARTICIPANT_EVENT_KEY);
    },
};

/** Dispara o evento que o `AuthContext` escuta para derrubar a sessão. */
export function forceLogout(reason?: string): void {
    TokenStore.clear();
    window.dispatchEvent(new CustomEvent('auth:forceLogout', { detail: reason }));
}

import { Api } from '../Axios-Config';
import {
    AcceptInviteRequest,
    InviteDto,
    LoginRequest,
    PagedResult,
    TokenResponse,
    UserDto,
} from '../Types';

/**
 * Serviços de autenticação (`/api/v1/auth`) e admin de plataforma
 * (`/api/v1/admin`). Os tokens são gravados no `TokenStore` pelo chamador.
 */
export const AuthService = {
    /** `POST /auth/login` — rate limit 10 req/min por IP. */
    Login: async (data: LoginRequest): Promise<TokenResponse> => {
        const response = await Api.post<TokenResponse>('/auth/login', data);
        return response.data;
    },

    /** `POST /auth/refresh` — rotaciona o refresh token. */
    Refresh: async (refreshToken: string): Promise<TokenResponse> => {
        const response = await Api.post<TokenResponse>('/auth/refresh', { refreshToken });
        return response.data;
    },

    /** `POST /auth/logout` — idempotente (204). */
    Logout: async (refreshToken: string): Promise<void> => {
        await Api.post('/auth/logout', { refreshToken });
    },

    /** `GET /auth/me` — exige JWT. */
    Me: async (): Promise<UserDto> => {
        const response = await Api.get<UserDto>('/auth/me');
        return response.data;
    },

    /** `POST /auth/accept-invite` — público (RL auth); devolve tokens. */
    AcceptInvite: async (data: AcceptInviteRequest): Promise<TokenResponse> => {
        const response = await Api.post<TokenResponse>('/auth/accept-invite', data);
        return response.data;
    },

    // --- Admin de plataforma (JWT com platform_admin=true) ---

    /** `POST /admin/invites` — o `token` é devolvido uma única vez. */
    CreateInvite: async (data: { email: string; displayName: string }): Promise<InviteDto> => {
        const response = await Api.post<InviteDto>('/admin/invites', data);
        return response.data;
    },

    /** `GET /admin/users` — lista paginada de usuários. */
    ListUsers: async (params: { page?: number; pageSize?: number } = {}): Promise<PagedResult<UserDto>> => {
        const response = await Api.get<PagedResult<UserDto>>('/admin/users', { params });
        return response.data;
    },
};

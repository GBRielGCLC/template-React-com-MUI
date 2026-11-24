/** DTOs de autenticação e usuário (`/auth` e `/admin`). */

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AcceptInviteRequest {
    token: string;
    /** 10..128, ≥1 maiúscula, ≥1 minúscula, ≥1 número, ≥1 especial. */
    password: string;
}

export interface UserDto {
    id: string;
    email: string;
    displayName: string;
    isPlatformAdmin: boolean;
    createdAt: string;
}

/** Resposta de `/auth/login`, `/auth/refresh` e `/auth/accept-invite`. */
export interface TokenResponse {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    user: UserDto;
}

/** Resposta de `POST /admin/invites`. O `token` é devolvido uma única vez. */
export interface InviteDto {
    id: string;
    email: string;
    token: string;
    expiresAt: string;
}

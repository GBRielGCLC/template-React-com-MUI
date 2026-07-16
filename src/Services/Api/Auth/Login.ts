// TODO: Implemente sua chamada de login aqui
// Exemplo de interface para o serviço de autenticação

export interface LoginRequest {
    name: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email?: string;
        roles?: string[];
    };
}

export const AuthService = {
    Login: async (data: LoginRequest): Promise<LoginResponse> => {
        // TODO: Substituir pela chamada API real
        // const response = await Api.post<LoginResponse>('/auth/login', data);
        // return response.data;

        throw new Error('AuthService.Login não implementado. Substitua pela sua API real.');
    },

    Refresh: async (refreshToken: string): Promise<LoginResponse> => {
        // TODO: Substituir pela chamada API real
        // const response = await Api.post<LoginResponse>('/auth/refresh', { refreshToken });
        // return response.data;

        throw new Error('AuthService.Refresh não implementado. Substitua pela sua API real.');
    },
};

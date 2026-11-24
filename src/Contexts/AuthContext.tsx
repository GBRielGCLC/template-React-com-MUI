import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AuthService } from "../Services/Api/Auth/AuthService";
import { toApiError } from "../Services/Api/Errors";
import { TokenStore } from "../Services/Api/TokenStore";
import { TokenResponse, UserDto } from "../Services/Api/Types";

export interface IUser {
    id: string;
    name: string;
    email: string;
    isPlatformAdmin: boolean;
}

/** Converte o `UserDto` da API no `IUser` usado pela UI. */
const toIUser = (dto: UserDto): IUser => ({
    id: dto.id,
    name: dto.displayName,
    email: dto.email,
    isPlatformAdmin: dto.isPlatformAdmin,
});

interface AuthContextType {
    user: IUser | null;
    isAuthenticated: boolean;
    /**
     * `eventId` quando há uma sessão de **participante** (token vindo do
     * link de acesso). Sessões são mutuamente exclusivas com a de usuário:
     * nunca enviamos JWT e `X-Participant-Token` juntos (o `/join` oferece a
     * troca, e o `login` limpa um PT remanescente).
     */
    participantEventId: string | null;
    isParticipant: boolean;
    isLoading: boolean;
    login: (data: { email: string; password: string }) => Promise<void>;
    /** Aceita um convite (`POST /auth/accept-invite`) e entra na nova sessão. */
    acceptInvite: (token: string, password: string) => Promise<void>;
    /** Entra no evento pelo accessToken do participante (link de acesso). */
    joinAsParticipant: (eventId: string, token: string) => void;
    /** Sai da sessão de participante. */
    leaveParticipant: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // O access token fica em memória (TokenStore); o usuário fica no
    // localStorage e é restaurado aqui. O refresh silencioso acontece no
    // primeiro 401, via interceptor.
    const [user, setUser] = useState<IUser | null>(() => {
        const stored = TokenStore.getUser();
        return stored ? toIUser(stored) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    // Sessão de participante vive no sessionStorage (TokenStore) — lida na
    // montagem para sobreviver ao refresh da página em /events/:eventId.
    const [participantEventId, setParticipantEventId] = useState<string | null>(
        () => TokenStore.getParticipantEventId(),
    );

    /** Grava a resposta de token e assume a sessão de usuário (limpa a de participante). */
    const applySession = useCallback((response: TokenResponse) => {
        TokenStore.setAccessToken(response.accessToken);
        TokenStore.setRefreshToken(response.refreshToken);
        TokenStore.setUser(response.user);
        // Sessões mutuamente exclusivas: nunca JWT + X-Participant-Token juntos.
        TokenStore.setParticipantSession('', null);
        setParticipantEventId(null);
        setUser(toIUser(response.user));
    }, []);

    const login = useCallback(async (data: { email: string; password: string }) => {
        setIsLoading(true);
        try {
            const response = await AuthService.Login(data);
            applySession(response);
            toast.success('Login realizado com sucesso!');
        } catch (error) {
            const apiError = toApiError(error);
            // Erros de credencial/bloqueio vêm com detail pt-BR da API.
            toast.error(apiError.detail ?? 'Erro ao realizar login');
            throw apiError;
        } finally {
            setIsLoading(false);
        }
    }, [applySession]);

    const acceptInvite = useCallback(async (token: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await AuthService.AcceptInvite({ token, password });
            applySession(response);
            toast.success(`Convite aceito! Bem-vindo(a), ${response.user.displayName}.`);
        } catch (error) {
            // Erros (409 invite.user_exists, 422 invite.invalid etc.) são
            // exibidos pela tela /invite — sem toast aqui para não duplicar.
            throw toApiError(error);
        } finally {
            setIsLoading(false);
        }
    }, [applySession]);

    const logout = useCallback(() => {
        const refreshToken = TokenStore.getRefreshToken();
        if (refreshToken) {
            // Idempotente (204) — melhor esforço, não bloqueia a navegação.
            AuthService.Logout(refreshToken).catch(() => undefined);
        }
        TokenStore.clear();
        setUser(null);
        setParticipantEventId(null);
    }, []);

    const joinAsParticipant = useCallback((eventId: string, token: string) => {
        TokenStore.setParticipantSession(eventId, token);
        setParticipantEventId(eventId);
    }, []);

    const leaveParticipant = useCallback(() => {
        TokenStore.setParticipantSession(TokenStore.getParticipantEventId() ?? '', null);
        setParticipantEventId(null);
    }, []);

    useEffect(() => {
        const handleForceLogout = (event: Event) => {
            const reason = (event as CustomEvent<string>).detail;
            setUser(null);
            // forceLogout limpou o TokenStore — sincroniza o estado do participante.
            setParticipantEventId(TokenStore.getParticipantEventId());
            if (reason) toast.warn(reason);
        };
        window.addEventListener('auth:forceLogout', handleForceLogout);
        return () => window.removeEventListener('auth:forceLogout', handleForceLogout);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            participantEventId,
            isParticipant: !!participantEventId,
            isLoading,
            login,
            acceptInvite,
            joinAsParticipant,
            leaveParticipant,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

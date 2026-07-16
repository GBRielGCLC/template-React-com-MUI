import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export interface IUser {
    id: string;
    name: string;
    email?: string;
    roles?: string[];
}

interface AuthContextType {
    user: IUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: { name: string; password: string }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    const login = useCallback(async (data: { name: string; password: string }) => {
        setIsLoading(true);
        try {
            // TODO: Substitua esta chamada pela sua API real
            // const response = await AuthService.Login(data);
            // localStorage.setItem('accessToken', response.accessToken);
            // localStorage.setItem('refreshToken', response.refreshToken);
            // localStorage.setItem('user', JSON.stringify(response.user));
            // setUser(response.user);

            // Stub temporário para desenvolvimento
            const mockUser: IUser = { id: '1', name: data.name, roles: ['admin'] };
            localStorage.setItem('user', JSON.stringify(mockUser));
            setUser(mockUser);
            toast.success('Login realizado com sucesso!');
        } catch (error) {
            toast.error('Erro ao realizar login');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    useEffect(() => {
        const handleForceLogout = () => logout();
        window.addEventListener('auth:forceLogout', handleForceLogout);
        return () => window.removeEventListener('auth:forceLogout', handleForceLogout);
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

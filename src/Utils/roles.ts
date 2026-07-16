import { useAuth } from "../Contexts/AuthContext";

export const useAllowedRoles = () => {
    const { user } = useAuth();

    const hasAccess = (allowedRoles?: string[]): boolean => {
        if (!user) return false;

        if (user.roles?.includes('admin')) return true;

        if (!allowedRoles || allowedRoles.length === 0) return true;

        return allowedRoles.some(role => user.roles?.includes(role));
    };

    return hasAccess;
};

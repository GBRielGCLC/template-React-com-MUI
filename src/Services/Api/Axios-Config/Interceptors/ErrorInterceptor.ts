import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

export const errorInterceptor = async (error: AxiosError) => {
    const originalRequest = error.config!;

    if (error.response?.status === 401 && !originalRequest.url?.includes('Auth/refresh')) {
        toast.warn("Sessão expirada. Faça login novamente!");
        window.dispatchEvent(new CustomEvent('auth:forceLogout'));
        return Promise.reject(new Error('Sessão expirada'));
    }

    if (error.message === 'Network Error') {
        return Promise.reject(new Error('Erro ao se comunicar com o servidor, verifique sua conexão com a internet.'));
    }

    if (error.response?.status === 400) {
        const data = error.response.data as any;
        return Promise.reject(new Error(extractMessage(data)));
    }

    if (error.response?.status === 403) {
        return Promise.reject(new Error('Você não tem permissão para esta ação.'));
    }

    if (error.response?.status === 404 && !error.response.data) {
        return Promise.reject(new Error('Registro não encontrado!'));
    }

    if (error.response?.status === 500) {
        console.error(`${error.config?.method} ${error.config?.url}: ${extractMessage(error.response?.data)}`);
        return Promise.reject(new Error('Erro interno do servidor'));
    }

    function defaultMessageByRequestType(error: AxiosError) {
        if (error.config?.method) {
            switch (error.config.method) {
                case 'get':
                    return 'Erro ao consultar o registro';
                case 'post':
                    return 'Erro ao criar o registro';
                case 'put':
                case 'patch':
                    return 'Erro ao editar o registro';
                case 'delete':
                    return 'Erro ao deletar o registro';
            }
        }
        return 'Erro inesperado';
    }

    function extractMessage(data: any): string {
        if (!data) return defaultMessageByRequestType(error);
        if (typeof data === 'string') return data;
        if (typeof data === 'object' && data.message) return data.message;
        return defaultMessageByRequestType(error);
    }

    console.error(`${error.config?.method} ${error.config?.url}: ${extractMessage(error.response?.data)}`);
    return Promise.reject(new Error(extractMessage(error.response?.data)));
};

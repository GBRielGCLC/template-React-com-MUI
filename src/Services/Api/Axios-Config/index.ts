import axios from 'axios';
import { responseInterceptor, errorInterceptor } from './Interceptors';
import { TokenStore } from '../TokenStore';

/**
 * Base URL da API: `REACT_APP_API_URL` se definida; em produção usa o
 * mesmo origin com prefixo `/api/v1`; em dev, `http://localhost:5000/api/v1`.
 */
const URL_BASE_API =
    process.env.REACT_APP_API_URL ??
    (process.env.NODE_ENV === 'production'
        ? window.location.origin + '/api/v1'
        : 'http://localhost:5000/api/v1');

const Api = axios.create({
    baseURL: URL_BASE_API,
});

// Request: Bearer (usuário logado) + X-Participant-Token (participante do evento).
Api.interceptors.request.use((config) => {
    const token = TokenStore.getAccessToken();
    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }

    const participantToken = TokenStore.getParticipantToken();
    if (participantToken) {
        config.headers.set('X-Participant-Token', participantToken);
    }

    return config;
});

async function readBlobData(blob: Blob): Promise<string | object> {
    const text = await blob.text();
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

Api.interceptors.response.use(
    async (response) => {
        if (response.data instanceof Blob && (response.headers['content-type'] as string)?.includes('json')) {
            response.data = await readBlobData(response.data);
        }
        return responseInterceptor(response);
    },
    async (error) => {
        if (error.response?.data instanceof Blob) {
            error.response.data = await readBlobData(error.response.data);
        }
        return errorInterceptor(error);
    },
);

export { Api };
export { URL_BASE_API };

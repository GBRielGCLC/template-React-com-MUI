import axios from 'axios';
import { responseInterceptor, errorInterceptor } from './Interceptors';

const URL_BASE_API = window.location.origin;

const Api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' ?
        URL_BASE_API + '/api' : 'http://localhost:5000/api/',
});

Api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

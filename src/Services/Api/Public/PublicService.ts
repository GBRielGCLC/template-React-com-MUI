import { Api } from '../Axios-Config';
import { PublicEventDto } from '../Types';

/**
 * API pública (`/api/v1/public/events/{token}`) — sem autenticação.
 * Rate limit 60 req/min por IP; `404 public_event.not_found` se o link
 * estiver desabilitado ou rotacionado.
 *
 * O token é **segredo** (a resposta expõe chaves Pix): não logar nem
 * mandar para analytics.
 */
export const PublicService = {
    /** `GET /public/events/{token}` — visão somente leitura agregada. */
    GetEvent: async (token: string): Promise<PublicEventDto> => {
        const response = await Api.get<PublicEventDto>(`/public/events/${token}`);
        return response.data;
    },
};

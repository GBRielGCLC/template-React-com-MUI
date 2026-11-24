import { Api } from '../Axios-Config';
import { BalancesResponse, SettlementsResponse } from '../Types';

/** Saldos e acertos (`/api/v1/events/{eventId}`) — JWT ou token de participante. */
export const BalancesService = {
    /** `GET /events/{eventId}/balances` — fonte da verdade dos saldos. */
    GetBalances: async (eventId: string): Promise<BalancesResponse> => {
        const response = await Api.get<BalancesResponse>(`/events/${eventId}/balances`);
        return response.data;
    },

    /**
     * `GET /events/{eventId}/settlements` — `settlements` é o fluxo oficial
     * (só confirmados); `projectedSettlements`/`pendingInformedPayments`
     * servem de aviso de pendentes de confirmação.
     */
    GetSettlements: async (eventId: string): Promise<SettlementsResponse> => {
        const response = await Api.get<SettlementsResponse>(`/events/${eventId}/settlements`);
        return response.data;
    },
};

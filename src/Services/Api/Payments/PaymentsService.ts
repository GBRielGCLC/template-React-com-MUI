import { Api } from '../Axios-Config';
import {
    CreatePaymentRequest,
    PagedResult,
    PaymentDto,
    PaymentListQuery,
    RejectPaymentRequest,
} from '../Types';

/**
 * Pagamentos de um evento (`/api/v1/events/{eventId}/payments`).
 * Participante (PT) só informa pagamento em que ele é o pagador
 * (`403 payment.self_only`); confirm/reject é só admin do evento.
 */
export const PaymentsService = {
    /** `GET /` — default `pageSize` 20; ordenação default `-createdAt`. */
    List: async (eventId: string, query: PaymentListQuery = {}): Promise<PagedResult<PaymentDto>> => {
        const response = await Api.get<PagedResult<PaymentDto>>(
            `/events/${eventId}/payments`,
            { params: query },
        );
        return response.data;
    },

    Get: async (eventId: string, paymentId: string): Promise<PaymentDto> => {
        const response = await Api.get<PaymentDto>(`/events/${eventId}/payments/${paymentId}`);
        return response.data;
    },

    /**
     * `POST /` — nasce `informed` (se o evento exige confirmação) ou
     * `confirmed` (se `requirePaymentConfirmation: false`).
     */
    Create: async (eventId: string, data: CreatePaymentRequest): Promise<PaymentDto> => {
        const response = await Api.post<PaymentDto>(`/events/${eventId}/payments`, data);
        return response.data;
    },

    /** `POST /{id}/confirm` — admin. `409 payment.not_informed` se já tratado. */
    Confirm: async (eventId: string, paymentId: string): Promise<PaymentDto> => {
        const response = await Api.post<PaymentDto>(`/events/${eventId}/payments/${paymentId}/confirm`);
        return response.data;
    },

    /** `POST /{id}/reject` — admin; `reason` obrigatório (1..500). */
    Reject: async (
        eventId: string,
        paymentId: string,
        data: RejectPaymentRequest,
    ): Promise<PaymentDto> => {
        const response = await Api.post<PaymentDto>(
            `/events/${eventId}/payments/${paymentId}/reject`,
            data,
        );
        return response.data;
    },
};

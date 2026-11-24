import { Api } from '../Axios-Config';
import {
    CreateExpenseRequest,
    ExpenseDto,
    ExpenseListQuery,
    PagedResult,
    UpdateExpenseRequest,
} from '../Types';

/**
 * Despesas de um evento (`/api/v1/events/{eventId}/expenses`).
 * Leitura: JWT ou participante; escrita: admin, criador ou pagador.
 */
export const ExpensesService = {
    /** `GET /` — default `pageSize` 20; ordenação default `-date`. */
    List: async (eventId: string, query: ExpenseListQuery = {}): Promise<PagedResult<ExpenseDto>> => {
        const response = await Api.get<PagedResult<ExpenseDto>>(
            `/events/${eventId}/expenses`,
            { params: query },
        );
        return response.data;
    },

    Get: async (eventId: string, expenseId: string): Promise<ExpenseDto> => {
        const response = await Api.get<ExpenseDto>(`/events/${eventId}/expenses/${expenseId}`);
        return response.data;
    },

    /** `POST /` — 201 com `Location`. `shares` é calculado pelo servidor. */
    Create: async (eventId: string, data: CreateExpenseRequest): Promise<ExpenseDto> => {
        const response = await Api.post<ExpenseDto>(`/events/${eventId}/expenses`, data);
        return response.data;
    },

    /**
     * `PUT /{id}` — corpo idêntico ao create (enviar o `split` original,
     * **não** o `shares` devolvido pelo GET). `403 expense.edit_forbidden`.
     */
    Update: async (
        eventId: string,
        expenseId: string,
        data: UpdateExpenseRequest,
    ): Promise<ExpenseDto> => {
        const response = await Api.put<ExpenseDto>(
            `/events/${eventId}/expenses/${expenseId}`,
            data,
        );
        return response.data;
    },

    /** `DELETE /{id}` — 204 (soft delete). */
    Remove: async (eventId: string, expenseId: string): Promise<void> => {
        await Api.delete(`/events/${eventId}/expenses/${expenseId}`);
    },
};

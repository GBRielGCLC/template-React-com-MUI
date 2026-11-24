import { PageQuery, SplitType } from './common';

/**
 * Corpo de `POST /expenses` e `PUT /expenses/{id}` (corpos idênticos).
 *
 * Regras por `split.type`:
 * - `equal`: só `participantId` em cada alocação; sem `remainderParticipantIds`.
 * - `fixed`: `amountCents > 0` em todas; soma = `totalAmountInCents` exatamente.
 * - `percentage`: `percentageBasisPoints` em todas; soma = 10000 exatamente.
 * - `remaining`: `amountCents > 0` nas fixas + `remainderParticipantIds` não vazio
 *   se sobrar valor; sem sobreposição entre fixos e remainder.
 */
export interface ExpenseSplitRequest {
    type: SplitType;
    allocations: ExpenseAllocationRequest[];
    remainderParticipantIds?: string[];
}

export interface ExpenseAllocationRequest {
    participantId: string;
    /** Apenas `fixed` / `remaining`. */
    amountCents?: number;
    /** Apenas `percentage`: 0..10000 (10000 = 100%). */
    percentageBasisPoints?: number;
}

export type CreateExpenseRequest = ExpenseRequestBase;
export type UpdateExpenseRequest = ExpenseRequestBase;

export interface ExpenseRequestBase {
    /** 1..200. */
    description: string;
    /** > 0 e ≤ 100_000_000_000 (R$ 1 bi). */
    totalAmountInCents: number;
    /** `yyyy-MM-dd` ou `null`. */
    date?: string | null;
    paidByParticipantId: string;
    split: ExpenseSplitRequest;
    /** ≤2000. */
    notes?: string | null;
}

/** Cota calculada pelo servidor (não reenviar no PUT). Ordenada por `participantName`. */
export interface ExpenseShare {
    participantId: string;
    participantName: string;
    amountCents: number;
    /** Só preenchido em split `percentage`. */
    percentageBasisPoints: number | null;
}

export interface ExpensePermissions {
    canEdit: boolean;
    canDelete: boolean;
}

export interface ExpenseDto {
    id: string;
    eventId: string;
    description: string;
    totalAmountInCents: number;
    date: string | null;
    paidByParticipantId: string;
    paidByParticipantName: string;
    splitType: SplitType;
    notes: string | null;
    shares: ExpenseShare[];
    permissions: ExpensePermissions;
    createdAt: string;
    updatedAt: string;
}

export interface ExpenseListQuery extends PageQuery {
    /** Substring na `description`. */
    search?: string;
    paidByParticipantId?: string;
    /** `date` | `-date` | `createdat` | `-createdAt` | `amount` | `-amount` (default `-date`). */
    sort?: string;
}

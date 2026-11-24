import { PageQuery, PaymentStatus } from './common';

/** Corpo de `POST /payments`. */
export interface CreatePaymentRequest {
    fromParticipantId: string;
    toParticipantId: string;
    /** > 0 e ≤ 100_000_000_000. */
    amountCents: number;
    /** ≤500. */
    note?: string | null;
}

/** Corpo de `POST /payments/{id}/reject`. */
export interface RejectPaymentRequest {
    /** 1..500. */
    reason: string;
}

export interface PaymentParticipantRef {
    id: string;
    name: string;
}

export interface PaymentDto {
    id: string;
    eventId: string;
    from: PaymentParticipantRef;
    to: PaymentParticipantRef;
    amountCents: number;
    /**
     * `informed` → aguarda confirmação do admin (se o evento exige);
     * `confirmed` → aceito; `rejected` → recusado (ver `rejectionReason`).
     */
    status: PaymentStatus;
    note: string | null;
    informedAt: string;
    confirmedAt: string | null;
    rejectedAt: string | null;
    rejectionReason: string | null;
}

export interface PaymentListQuery extends PageQuery {
    status?: PaymentStatus;
    /** `createdAt` | `-createdAt` | `amount` | `-amount` (default `-createdAt`). */
    sort?: string;
}

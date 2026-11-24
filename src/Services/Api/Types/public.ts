import { EventStatus } from './common';
import { BalancesResponse, SettlementsResponse } from './balances';
import { ExpenseDto } from './expenses';
import { PaymentDto } from './payments';
import { ParticipantDto } from './participants';

/** Resposta de `GET /public/events/{token}` — visão somente leitura agregada. */

export interface PublicEventSummary {
    id: string;
    name: string;
    description: string | null;
    currency: string;
    status: EventStatus;
    requirePaymentConfirmation: boolean;
    changeVersion: number;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
}

export interface PublicParticipantDto {
    id: string;
    name: string;
    pixKey: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PublicEventDto {
    event: PublicEventSummary;
    participants: PublicParticipantDto[];
    /** `permissions` sempre `{ canEdit: false, canDelete: false }`. */
    expenses: ExpenseDto[];
    balances: BalancesResponse;
    settlements: SettlementsResponse;
    payments: PaymentDto[];
}

/** Reexporta para conveniência de quem consome só o módulo público. */
export type { ParticipantDto };

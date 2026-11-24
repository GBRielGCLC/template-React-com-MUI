/** Payloads do hub SignalR `/hubs/events` (evento `ReceiveEvent`). */

export type ReceiveEventType =
    | 'EventCreated'
    | 'EventUpdated'
    | 'EventClosed'
    | 'EventReopened'
    | 'ParticipantAdded'
    | 'ParticipantUpdated'
    | 'ExpenseCreated'
    | 'ExpenseUpdated'
    | 'ExpenseDeleted'
    | 'PaymentInformed'
    | 'PaymentConfirmed'
    | 'PaymentRejected'
    | 'BalancesRecalculated';

export interface ReceiveEventPayload {
    type: ReceiveEventType;
    eventId: string;
    /** Maior que o da tela → refazer fetch das telas afetadas. */
    changeVersion: number;
    /** `null` em `BalancesRecalculated`. */
    entityId: string | null;
    occurredAt: string;
}

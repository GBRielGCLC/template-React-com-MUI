/** DTOs de `GET /events/{id}/balances` e `GET /events/{id}/settlements`. */

export interface BalanceParticipantDto {
    participantId: string;
    name: string;
    isActive: boolean;
    paidCents: number;
    owedCents: number;
    /** > 0 = tem a receber; < 0 = deve. Soma geral = 0. */
    netCents: number;
    confirmedSentCents: number;
    confirmedReceivedCents: number;
    /** Saldo oficial (só pagamentos confirmados). Soma geral = 0. */
    adjustedNetCents: number;
    informedSentCents: number;
    informedReceivedCents: number;
    /** Projeção (confirmados + informados). Soma geral = 0. */
    projectedNetCents: number;
}

export interface BalancesResponse {
    eventId: string;
    currency: string;
    totalExpensesCents: number;
    confirmedPaymentsCents: number;
    informedPaymentsCents: number;
    /** Inclui participantes inativos (`isActive: false`). */
    participants: BalanceParticipantDto[];
    changeVersion: number;
    calculatedAt: string;
}

export interface SettlementDto {
    fromParticipantId: string;
    fromName: string;
    toParticipantId: string;
    toName: string;
    amountCents: number;
    /** Chave Pix do recebedor — pode ser `null`. Botão de copiar Pix. */
    toPixKey: string | null;
}

/**
 * `settlements` = fluxo oficial (só confirmados);
 * `projectedSettlements`/`pendingInformedPayments` = aviso de pendentes.
 */
export interface SettlementsResponse {
    eventId: string;
    currency: string;
    totalOpenCents: number;
    settlements: SettlementDto[];
    projectedSettlements: SettlementDto[];
    pendingInformedPayments: import('./payments').PaymentDto[];
    calculatedAt: string;
}

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import { yup } from '../../../../Services';
import { ParticipantsService } from '../../../../Services/Api/Participants/ParticipantsService';
import { ExpensesService } from '../../../../Services/Api/Expenses/ExpensesService';
import {
    CreateExpenseRequest,
    ExpenseDto,
    ExpenseSplitRequest,
    ParticipantDto,
    SplitType,
} from '../../../../Services/Api/Types';
import { toApiError } from '../../../../Services/Api/Errors';
import { toastManager } from '../../../../Services/ToastUtils';
import { formatarMoeda } from '../../../../Services/Formatters';

export interface IExpenseForm {
    description: string;
    totalAmount: number | null;
    /** `yyyy-MM-dd` ou `''`. */
    date: string;
    paidByParticipantId: string;
    notes: string;
}

export interface SplitParticipant {
    id: string;
    name: string;
    active: boolean;
}

export const SPLIT_OPTIONS: { value: SplitType; label: string }[] = [
    { value: 'equal', label: 'Igual' },
    { value: 'fixed', label: 'Valores fixos' },
    { value: 'percentage', label: 'Percentual' },
    { value: 'remaining', label: 'Fixo + restante' },
];

export const SPLIT_HINTS: Record<SplitType, string> = {
    equal: 'O valor é dividido igualmente entre os participantes selecionados (os centavos excedentes são distribuídos 1 a 1).',
    fixed: 'Cada participante recebe um valor fixo — a soma deve ser exatamente igual ao total da despesa.',
    percentage: 'Cada participante recebe uma fatia em porcentagem — a soma deve ser exatamente 100%.',
    remaining: 'Informe valores fixos para alguns; o restante é dividido entre os demais participantes marcados.',
};

const expenseSchema = yup.object({
    description: yup
        .string()
        .defined()
        .trim()
        .required('Informe a descrição da despesa')
        .max(200, 'A descrição pode ter no máximo 200 caracteres'),
    totalAmount: yup
        .number()
        .typeError('Informe o valor da despesa')
        .defined()
        .nullable()
        .test('is-positive', 'O valor deve ser maior que zero', (value) => typeof value === 'number' && value > 0),
    date: yup
        .string()
        .defined()
        .test('valid-date', 'Data inválida', (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)),
    paidByParticipantId: yup
        .string()
        .defined()
        .required('Informe quem pagou'),
    notes: yup
        .string()
        .defined()
        .max(2000, 'As observações podem ter no máximo 2000 caracteres'),
});

const toCents = (reais: number | null | undefined): number => Math.round((reais ?? 0) * 100);

const distributeCents = (cents: number, count: number): number[] => {
    if (count <= 0) return [];
    const safeCents = Math.max(0, cents);
    const base = Math.floor(safeCents / count);
    const remainder = safeCents % count;
    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
};

interface UseExpenseFormParams {
    open: boolean;
    eventId: string;
    expense?: ExpenseDto | null;
    onSaved: () => void;
}

export const useExpenseForm = ({ open, eventId, expense, onSaved }: UseExpenseFormParams) => {
    const isEdit = !!expense;

    const [participants, setParticipants] = useState<ParticipantDto[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const [splitType, setSplitType] = useState<SplitType>('equal');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [amounts, setAmounts] = useState<Record<string, number | null>>({});
    const [percentages, setPercentages] = useState<Record<string, number | null>>({});
    const [splitError, setSplitError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<IExpenseForm>({
        resolver: yupResolver(expenseSchema),
        defaultValues: {
            description: '',
            totalAmount: null,
            date: dayjs().format('YYYY-MM-DD'),
            paidByParticipantId: '',
            notes: '',
        },
    });

    const totalAmount = watch('totalAmount');

    const splitParticipants = useMemo<SplitParticipant[]>(() => {
        const list: SplitParticipant[] = participants.map((p) => ({
            id: p.id,
            name: p.name,
            active: p.isActive,
        }));

        expense?.shares.forEach((share) => {
            if (!list.some((p) => p.id === share.participantId)) {
                list.push({ id: share.participantId, name: share.participantName, active: false });
            }
        });

        return list;
    }, [participants, expense]);

    const hiddenInactiveCount = useMemo(() => {
        if (showInactive) return 0;
        const shareIds = new Set(expense?.shares.map((s) => s.participantId) ?? []);
        return splitParticipants.filter((p) => !p.active && !shareIds.has(p.id)).length;
    }, [splitParticipants, showInactive, expense]);

    const visibleParticipants = useMemo(() => {
        if (showInactive) return splitParticipants;
        const shareIds = new Set(expense?.shares.map((s) => s.participantId) ?? []);
        return splitParticipants.filter((p) => p.active || shareIds.has(p.id));
    }, [splitParticipants, showInactive, expense]);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setParticipantsLoading(true);

        ParticipantsService.List(eventId, { pageSize: 100, sort: 'name' })
            .then((result) => {
                if (!cancelled) setParticipants(result.items);
            })
            .catch((error) => {
                if (!cancelled) console.error('Erro ao carregar participantes:', toApiError(error));
            })
            .finally(() => {
                if (!cancelled) setParticipantsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, eventId]);

    useEffect(() => {
        if (!open) return;

        setSplitError(null);
        setShowInactive(false);

        if (expense) {
            reset({
                description: expense.description,
                totalAmount: expense.totalAmountInCents / 100,
                date: expense.date ?? '',
                paidByParticipantId: expense.paidByParticipantId,
                notes: expense.notes ?? '',
            });

            setSplitType(expense.splitType);
            setSelectedIds(expense.shares.map((s) => s.participantId));

            if (expense.splitType === 'percentage') {
                setPercentages(Object.fromEntries(
                    expense.shares.map((s) => [s.participantId, (s.percentageBasisPoints ?? 0) / 100]),
                ));
                setAmounts({});
            } else if (expense.splitType === 'equal') {
                setPercentages({});
                setAmounts({});
            } else {
                setPercentages({});
                setAmounts(Object.fromEntries(
                    expense.shares.map((s) => [s.participantId, s.amountCents / 100]),
                ));
            }
        } else {
            reset({
                description: '',
                totalAmount: null,
                date: dayjs().format('YYYY-MM-DD'),
                paidByParticipantId: '',
                notes: '',
            });
            setSplitType('equal');
            setSelectedIds([]);
            setAmounts({});
            setPercentages({});
        }
    }, [open, expense, reset]);

    useEffect(() => {
        if (!open || isEdit || participants.length === 0) return;
        const activeIds = participants.filter((p) => p.isActive).map((p) => p.id);
        setSelectedIds((current) => (current.length > 0 ? current : activeIds));
    }, [open, isEdit, participants]);

    const totalCents = toCents(totalAmount);
    const fixedSumCents = selectedIds.reduce((acc, id) => acc + toCents(amounts[id]), 0);
    const percentageBpSum = selectedIds.reduce(
        (acc, id) => acc + Math.round((percentages[id] ?? 0) * 100),
        0,
    );
    const remainderIds = useMemo(
        () => selectedIds.filter((id) => !((amounts[id] ?? null) !== null && toCents(amounts[id]) > 0)),
        [selectedIds, amounts],
    );

    // Prévia por participante nos modos 'equal' e 'remaining'
    const previewCentsById = useMemo<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        if (splitType === 'equal' && selectedIds.length > 0) {
            const shares = distributeCents(totalCents, selectedIds.length);
            selectedIds.forEach((id, idx) => {
                map[id] = shares[idx] ?? 0;
            });
        } else if (splitType === 'remaining' && remainderIds.length > 0) {
            const remCents = Math.max(0, totalCents - fixedSumCents);
            const shares = distributeCents(remCents, remainderIds.length);
            remainderIds.forEach((id, idx) => {
                map[id] = shares[idx] ?? 0;
            });
        }
        return map;
    }, [splitType, selectedIds, remainderIds, totalCents, fixedSumCents]);

    // Diferença restante para completar em 'fixed' ou 'percentage'
    const missingFixedCents = splitType === 'fixed' ? totalCents - fixedSumCents : 0;
    const missingPercentageBp = splitType === 'percentage' ? 10000 - percentageBpSum : 0;

    const handleSplitTypeChange = (value: SplitType | null) => {
        if (value) {
            setSplitType(value);
            setSplitError(null);
        }
    };

    const toggleSelected = (id: string) => {
        setSplitError(null);
        setSelectedIds((current) => (
            current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
        ));
    };

    const toggleSelectAllVisible = () => {
        setSplitError(null);
        const visibleIds = visibleParticipants.map((p) => p.id);
        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

        if (allVisibleSelected) {
            setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
        }
    };

    const handleAmountChange = (id: string, value: number | null) => {
        setSplitError(null);
        setAmounts((current) => ({ ...current, [id]: value }));
    };

    const handlePercentageChange = (id: string, value: number | null) => {
        setSplitError(null);
        setPercentages((current) => ({ ...current, [id]: value }));
    };

    const handleCompleteRemaining = (id: string) => {
        setSplitError(null);
        if (splitType === 'fixed') {
            const currentCents = toCents(amounts[id]);
            const nextCents = Math.max(0, currentCents + missingFixedCents);
            setAmounts((current) => ({ ...current, [id]: Number((nextCents / 100).toFixed(2)) }));
        } else if (splitType === 'percentage') {
            const currentBp = Math.round((percentages[id] ?? 0) * 100);
            const nextBp = Math.max(0, currentBp + missingPercentageBp);
            setPercentages((current) => ({ ...current, [id]: Number((nextBp / 100).toFixed(2)) }));
        }
    };

    const validateSplit = (): string | null => {
        if (selectedIds.length === 0) return 'Selecione ao menos um participante para a divisão.';

        if (splitType === 'equal') return null;

        if (splitType === 'percentage') {
            if (selectedIds.some((id) => !((percentages[id] ?? null) !== null && percentages[id]! > 0))) {
                return 'Informe um percentual maior que zero para cada participante.';
            }
            if (percentageBpSum !== 10000) {
                const atual = (percentageBpSum / 100).toLocaleString('pt-br', { minimumFractionDigits: 2 });
                return `A soma dos percentuais deve ser exatamente 100% (atual: ${atual}%).`;
            }
            return null;
        }

        if (splitType === 'fixed') {
            if (selectedIds.some((id) => !((amounts[id] ?? null) !== null && toCents(amounts[id]) > 0))) {
                return 'Informe um valor maior que zero para cada participante.';
            }
            if (fixedSumCents !== totalCents) {
                return `A soma dos valores fixos (${formatarMoeda(fixedSumCents / 100)}) `
                    + `deve ser igual ao total da despesa (${formatarMoeda(totalCents / 100)}).`;
            }
            return null;
        }

        const fixedCount = selectedIds.length - remainderIds.length;
        if (fixedCount === 0) return 'Informe o valor fixo de pelo menos um participante.';
        if (selectedIds.some((id) => {
            const value = amounts[id];
            return (value ?? null) !== null && toCents(value) <= 0;
        })) {
            return 'Os valores fixos devem ser maiores que zero (deixe vazio para levar o restante).';
        }
        if (fixedSumCents > totalCents) {
            return `Os valores fixos (${formatarMoeda(fixedSumCents / 100)}) `
                + `não podem ultrapassar o total da despesa (${formatarMoeda(totalCents / 100)}).`;
        }
        if (fixedSumCents < totalCents && remainderIds.length === 0) {
            return `Ainda resta ${formatarMoeda((totalCents - fixedSumCents) / 100)} — `
                + 'marque ao menos um participante para levar o restante.';
        }
        return null;
    };

    const buildSplit = (): ExpenseSplitRequest => {
        if (splitType === 'equal') {
            return { type: 'equal', allocations: selectedIds.map((id) => ({ participantId: id })) };
        }
        if (splitType === 'percentage') {
            return {
                type: 'percentage',
                allocations: selectedIds.map((id) => ({
                    participantId: id,
                    percentageBasisPoints: Math.round((percentages[id] ?? 0) * 100),
                })),
            };
        }
        if (splitType === 'fixed') {
            return {
                type: 'fixed',
                allocations: selectedIds.map((id) => ({
                    participantId: id,
                    amountCents: toCents(amounts[id]),
                })),
            };
        }
        return {
            type: 'remaining',
            allocations: selectedIds
                .filter((id) => !remainderIds.includes(id))
                .map((id) => ({ participantId: id, amountCents: toCents(amounts[id]) })),
            remainderParticipantIds: remainderIds,
        };
    };

    const submitForm = handleSubmit(async (data: IExpenseForm) => {
        const splitProblem = validateSplit();
        if (splitProblem) {
            setSplitError(splitProblem);
            return;
        }
        setSplitError(null);

        try {
            const payload: CreateExpenseRequest = {
                description: data.description.trim(),
                totalAmountInCents: toCents(data.totalAmount),
                date: data.date || null,
                paidByParticipantId: data.paidByParticipantId,
                split: buildSplit(),
                notes: data.notes.trim() || null,
            };

            if (isEdit) {
                await ExpensesService.Update(eventId, expense!.id, payload);
                toastManager.success('Despesa atualizada!');
            } else {
                await ExpensesService.Create(eventId, payload);
                toastManager.success('Despesa registrada!');
            }
            onSaved();
        } catch (error) {
            const apiError = toApiError(error);

            if (apiError.isValidation && apiError.errors) {
                const fieldMap: Record<string, keyof IExpenseForm> = {
                    description: 'description',
                    totalAmountInCents: 'totalAmount',
                    date: 'date',
                    paidByParticipantId: 'paidByParticipantId',
                    notes: 'notes',
                };
                let mapped = false;

                Object.entries(apiError.errors).forEach(([field, messages]) => {
                    if (field === 'split') {
                        setSplitError(messages.join(' '));
                        return;
                    }
                    const formField = fieldMap[field];
                    if (formField) {
                        setError(formField, { message: messages[0] });
                        mapped = true;
                    }
                });

                if (mapped) return;
            }

            toastManager.error(apiError.message);
        }
    });

    const sumSummary = useMemo(() => {
        if (splitType === 'fixed') {
            const ok = fixedSumCents === totalCents;
            const diffText = !ok
                ? (fixedSumCents < totalCents
                    ? ` — falta ${formatarMoeda((totalCents - fixedSumCents) / 100)}`
                    : ` — excede ${formatarMoeda((fixedSumCents - totalCents) / 100)}`)
                : '';
            return {
                text: `Soma: ${formatarMoeda(fixedSumCents / 100)} de ${formatarMoeda(totalCents / 100)}${diffText}`,
                color: ok ? ('success.main' as const) : ('error.main' as const),
            };
        }

        if (splitType === 'percentage') {
            const ok = percentageBpSum === 10000;
            return {
                text: `Soma: ${(percentageBpSum / 100).toLocaleString('pt-br', { minimumFractionDigits: 2 })}%`,
                color: ok ? ('success.main' as const) : ('error.main' as const),
            };
        }

        if (splitType === 'remaining') {
            return {
                text: `Fixos: ${formatarMoeda(fixedSumCents / 100)} — restante: `
                    + `${formatarMoeda(Math.max(0, totalCents - fixedSumCents) / 100)} entre `
                    + `${remainderIds.length} participante${remainderIds.length === 1 ? '' : 's'}`,
                color: 'text.secondary' as const,
            };
        }

        return {
            text: `Dividido igualmente entre ${selectedIds.length} participante${selectedIds.length === 1 ? '' : 's'}`,
            color: 'text.secondary' as const,
        };
    }, [splitType, fixedSumCents, totalCents, percentageBpSum, remainderIds.length, selectedIds.length]);

    const noParticipants = !participantsLoading && participants.length === 0 && !isEdit;

    return {
        isEdit,
        control,
        errors,
        isSubmitting,
        participantsLoading,
        noParticipants,
        splitParticipants,
        visibleParticipants,
        hiddenInactiveCount,
        showInactive,
        splitType,
        selectedIds,
        amounts,
        percentages,
        previewCentsById,
        missingFixedCents,
        missingPercentageBp,
        splitError,
        sumSummary,
        setSplitError,
        setShowInactive,
        handleSplitTypeChange,
        toggleSelected,
        toggleSelectAllVisible,
        handleAmountChange,
        handlePercentageChange,
        handleCompleteRemaining,
        submitForm,
    };
};
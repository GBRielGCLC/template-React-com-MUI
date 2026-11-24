import React, { useState, useRef, useEffect } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

type NumericTextFieldProps = Omit<TextFieldProps, 'onChange'> & {
    onChange?: (value: number | undefined | null) => void;
    maxValue?: number;
    minValue?: number;
    decimal?: boolean;
    value?: number | string;
};

const NumericTextField = ({ onChange, onKeyDown, maxValue, minValue = 0, decimal = false, ...props }: NumericTextFieldProps) => {
    // Estado interno sempre como string para suportar a vírgula visual
    const [inputValue, setInputValue] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sincroniza quando o valor numérico vem de fora, formatando para vírgula
    useEffect(() => {
        if (props.value === undefined || props.value === null || props.value === "") {
            setInputValue("");
            return;
        }

        const stringVal = String(props.value).replace('.', ',');
        setInputValue(stringVal);
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let displayValue = e.target.value;

        if (displayValue === "") {
            setInputValue("");
            onChange?.(null);
            return;
        }

        // 1. Permitir apenas números e UMA vírgula (ou ponto, que convertemos)
        displayValue = displayValue.replace('.', ',');
        const regex = decimal ? /[^0-9,]/g : /\D/g;
        let cleanValue = displayValue.replace(regex, '');

        // Evita múltiplas vírgulas
        const parts = cleanValue.split(',');
        if (parts.length > 2) {
            cleanValue = `${parts[0]},${parts.slice(1).join('')}`;
        }

        // 2. Atualiza o estado visual COM a vírgula
        setInputValue(cleanValue);

        // 3. Converte para número (trocando vírgula por ponto) para avisar o pai
        if (cleanValue !== "" && !cleanValue.endsWith(',')) {
            const num = Number(cleanValue.replace(',', '.'));
            if (!isNaN(num)) {
                onChange?.(num);
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(',', '.');
        if (rawValue === "" || rawValue === ".") {
            setInputValue("");
            setErrorMessage(null);
            return;
        }

        const currentValue = Number(rawValue);
        if (isNaN(currentValue)) return;

        let finalValue = currentValue;
        let triggeredNotice = false;

        if (maxValue !== undefined && currentValue > maxValue) {
            finalValue = maxValue;
            setErrorMessage(`Máximo: ${maxValue}`);
            triggeredNotice = true;
        } else if (minValue !== undefined && currentValue < minValue) {
            finalValue = minValue;
            setErrorMessage(`Mínimo: ${minValue}`);
            triggeredNotice = true;
        }

        if (triggeredNotice) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setErrorMessage(null), 3000);

            // Corrige visualmente para o limite, mantendo a vírgula
            setInputValue(String(finalValue).replace('.', ','));
            onChange?.(finalValue);
        } else {
            setErrorMessage(null);
            // Formata o número final (ex: "10," vira "10")
            setInputValue(String(currentValue).replace('.', ','));
        }

        props.onBlur?.(e);
    };

    return (
        <TextField
            {...props}
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            type="text"
            error={!!errorMessage}
            helperText={errorMessage || props.helperText}
            slotProps={{
                ...props.slotProps,
                htmlInput: {
                    inputMode: decimal ? "decimal" : "numeric",
                    ...(props.slotProps?.htmlInput || {}),
                },
            }}
        />
    );
};

export default NumericTextField;
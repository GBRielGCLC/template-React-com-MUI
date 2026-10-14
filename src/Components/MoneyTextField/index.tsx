import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { InputAdornment, TextField, TextFieldProps } from "@mui/material";

// "prefix" também é atributo HTML do React (herdado pelo TextField), por isso sai do Omit
export type MoneyTextFieldProps = Omit<TextFieldProps, "onChange" | "value" | "prefix"> & {
    /**
     * Valor "limpo", do jeito que vai para o back (ex.: 1234.56).
     * Também aceita string numérica ("1234.56").
     */
    value?: number | string | null;
    /**
     * Devolve o valor limpo (ex.: 1234.56) para o hook form / estado.
     * Recebe `null` quando o campo está vazio.
     */
    onChange?: (value: number | null) => void;
    /** Casas decimais exibidas. Padrão 2. Use `0` ou `false` para trabalhar só com inteiros. */
    decimals?: number | false;
    /** Texto antes do valor (ex.: "R$", "US$"). Padrão "R$". Use `""` ou `false` para remover. */
    prefix?: string | false;
    /** Separador de milhar. Padrão ".". Use `false` ou `""` para desligar o agrupamento. */
    thousandSeparator?: string | false;
    /** Separador decimal. Padrão ",". */
    decimalSeparator?: string;
    minValue?: number;
    maxValue?: number;
};

interface MaskOptions {
    decimals: number;
    thousand: string | false;
    decimal: string;
}

/** O que foi digitado/colado, reduzido aos dígitos (a máscara monta o resto) */
interface ParsedInput {
    digits: string;
    negative: boolean;
}

const getMaskOptions = ({
    decimals,
    thousandSeparator,
    decimalSeparator,
}: Pick<MoneyTextFieldProps, "decimals" | "thousandSeparator" | "decimalSeparator">): MaskOptions => {
    let decimalsCount = 2;

    if (decimals === false || decimals === 0) {
        decimalsCount = 0;
    } else if (typeof decimals === "number" && decimals > 0) {
        decimalsCount = Math.floor(decimals);
    }

    const decimal = decimalSeparator || ",";
    const thousand =
        thousandSeparator === false || thousandSeparator === "" || thousandSeparator === decimal
            ? false
            : thousandSeparator ?? ".";

    return { decimals: decimalsCount, thousand, decimal };
};

/**
 * Digitando, o valor cresce da direita para a esquerda (estilo calculadora):
 * os dígitos digitados são sempre os menos significativos, então "1", "2", "3", "4"
 * monta "12,34". Separadores, prefixo e letras são ignorados (o agrupamento é refeito
 * na formatação).
 */
const parseInput = (raw: string): ParsedInput => {
    let digits = "";
    let negative = false;

    for (let i = 0; i < raw.length; i++) {
        const char = raw[i];

        if (char >= "0" && char <= "9") digits += char;
        else if (char === "-") negative = true;
    }

    return { digits, negative };
};

/**
 * Interpreta um texto colado como número escrito normalmente, respeitando os
 * separadores (ex.: "R$ 1.234,56", "1234.56" ou "1234").
 */
const parseNumberText = (raw: string, options: MaskOptions): ParsedInput => {
    const { decimals, thousand, decimal } = options;
    let int = "";
    let frac = "";
    let hasDecimal = false;
    let negative = false;

    for (let i = 0; i < raw.length; i++) {
        const char = raw[i];

        if (char >= "0" && char <= "9") {
            if (hasDecimal) {
                if (frac.length < decimals) frac += char;
            } else {
                int += char;
            }
            continue;
        }

        if (char === "-") {
            negative = true;
            continue;
        }

        // Sem casas decimais (ou caractere que não interessa: R$, letras, espaços...)
        if (decimals === 0 || (char !== "." && char !== ",")) continue;

        if (char === decimal) {
            if (!hasDecimal) hasDecimal = true;
            continue;
        }

        if (thousand && char === thousand) {
            // Só agrupa quando já existe inteiro de verdade e o bloco seguinte tem 3 dígitos
            const intDigits = int.replace(/^0+/, "");
            const group = /^\d+/.exec(raw.slice(i + 1));

            if (intDigits !== "" && group && group[0].length === 3) continue;
        }

        if (!hasDecimal) hasDecimal = true;
    }

    // A leitura é sempre "os últimos dígitos são a fração": completa a parte fracionária
    // com zeros até as casas decimais ("1234" = 1234,00 e "12,5" = 12,50)
    if (decimals > 0 && frac.length < decimals) frac += "0".repeat(decimals - frac.length);

    return { digits: int.replace(/^0+(?=\d)/, "") + frac, negative };
};

/** Divide os dígitos em parte inteira e fracionária, conforme as casas decimais */
const splitDigits = (digits: string, decimals: number): { int: string; frac: string } => {
    if (decimals <= 0) return { int: digits, frac: "" };

    const cut = digits.length - decimals;

    return cut > 0
        ? { int: digits.slice(0, cut), frac: digits.slice(cut) }
        : { int: "", frac: "0".repeat(-cut) + digits };
};

const buildDisplay = (parsed: ParsedInput, options: MaskOptions): string => {
    if (parsed.digits === "") return "";

    const { int, frac } = splitDigits(parsed.digits, options.decimals);
    const normalizedInt = int.replace(/^0+(?=\d)/, "") || "0";
    const grouped = options.thousand
        ? normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, options.thousand)
        : normalizedInt;
    const body = options.decimals > 0 ? grouped + options.decimal + frac : grouped;

    return parsed.negative ? "-" + body : body;
};

const formatNumber = (value: number, options: MaskOptions): string => {
    const fixed = (value === 0 ? 0 : value).toFixed(options.decimals);
    const negative = fixed.charAt(0) === "-";
    const parts = (negative ? fixed.slice(1) : fixed).split(".");

    return buildDisplay({ digits: parts[0] + (parts[1] || ""), negative }, options);
};

const toNumber = (parsed: ParsedInput, options: MaskOptions): number | null => {
    if (parsed.digits === "") return null;

    const { int, frac } = splitDigits(parsed.digits, options.decimals);
    const value = Number((parsed.negative ? "-" : "") + int + "." + frac);

    return Number.isNaN(value) ? null : value;
};

const countDigits = (text: string): number => {
    let count = 0;

    for (let i = 0; i < text.length; i++) {
        if (text[i] >= "0" && text[i] <= "9") count++;
    }

    return count;
};

const positionAfterDigits = (text: string, count: number): number => {
    if (count <= 0) return 0;

    let seen = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char >= "0" && char <= "9") {
            seen++;
            if (seen === count) return i + 1;
        }
    }

    return text.length;
};

export function MoneyTextField(props: MoneyTextFieldProps) {
    const {
        value,
        onChange,
        decimals,
        prefix = "R$",
        thousandSeparator = ".",
        decimalSeparator = ",",
        minValue,
        maxValue,
        onBlur,
        inputRef,
        slotProps,
        error,
        helperText,
        ...textFieldProps
    } = props;

    // Sem a prop `value` (ex.: usando só o onChange) o componente se cuida sozinho
    const isControlled = "value" in props;

    const options = useMemo(
        () => getMaskOptions({ decimals, thousandSeparator, decimalSeparator }),
        [decimals, thousandSeparator, decimalSeparator]
    );

    // Texto "mascarado" que aparece na tela
    const [display, setDisplay] = useState("");
    const [notice, setNotice] = useState<string | null>(null);

    const caretRef = useRef<number | null>(null);
    const noticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputElementRef = useRef<HTMLInputElement | null>(null);

    const setInputRef = useCallback(
        (element: HTMLInputElement | null) => {
            inputElementRef.current = element;

            if (typeof inputRef === "function") inputRef(element);
            else if (inputRef) (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = element;
        },
        [inputRef]
    );

    // Valor vindo de fora (reset do formulário, edição, etc.): reformata para a máscara
    useEffect(() => {
        if (!isControlled) return;

        const target = value === null || value === undefined || value === "" ? null : Number(value);
        const current = toNumber(parseInput(display), options);

        if (target === null || Number.isNaN(target)) {
            if (current !== null) setDisplay("");
            return;
        }

        // Se bate com o que está na tela, mantém como está (ex.: digitando "12,5" não vira "12,50")
        if (current !== target) setDisplay(formatNumber(target, options));
    }, [isControlled, value, display, options]);

    // Recoloca o cursor depois da regrupação da máscara
    useLayoutEffect(() => {
        if (caretRef.current === null) return;

        const position = caretRef.current;
        caretRef.current = null;

        const input = inputElementRef.current;
        if (!input) return;

        const nextPosition = position === -1 ? display.length : positionAfterDigits(display, position);
        input.setSelectionRange(nextPosition, nextPosition);
    }, [display]);

    useEffect(() => {
        return () => {
            if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
        };
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const raw = event.target.value;

        if (raw === "") {
            caretRef.current = null;
            setDisplay("");
            onChange?.(null);
            return;
        }

        const caret = event.target.selectionStart;
        if (caret === null) {
            caretRef.current = null;
        } else if (caret >= raw.length) {
            caretRef.current = -1; // cursor no fim: mais comum e sempre exato
        } else {
            caretRef.current = countDigits(raw.slice(0, caret));
        }

        const parsed = parseInput(raw);

        setDisplay(buildDisplay(parsed, options));
        onChange?.(toNumber(parsed, options));
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();

        // Texto colado é lido como número escrito ("R$ 1.234,56", "1234.56", "1234"...)
        const parsed = parseNumberText(event.clipboardData.getData("text"), options);

        caretRef.current = -1;
        setDisplay(buildDisplay(parsed, options));
        onChange?.(toNumber(parsed, options));
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        let current = toNumber(parseInput(display), options);
        let message: string | null = null;

        if (current === null) {
            setDisplay("");
            onChange?.(null);
            onBlur?.(event);
            return;
        }

        // Envia já arredondado nas casas decimais configuradas
        current = Number(current.toFixed(options.decimals));

        if (maxValue !== undefined && current > maxValue) {
            current = maxValue;
            message = `Máximo: ${maxValue}`;
        } else if (minValue !== undefined && current < minValue) {
            current = minValue;
            message = `Mínimo: ${minValue}`;
        }

        setDisplay(formatNumber(current, options));
        onChange?.(current);

        if (message) {
            if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
            setNotice(message);
            noticeTimeout.current = setTimeout(() => setNotice(null), 3000);
        }

        onBlur?.(event);
    };

    const showPrefix = prefix !== false && prefix !== "";
    const inputSlotProps: any = { ...(slotProps?.input as any) };

    // Só mostra o prefixo quando tem valor na tela, senão ele colide com o label em repouso
    if (showPrefix && display !== "") {
        inputSlotProps.startAdornment = <InputAdornment position="start">{prefix}</InputAdornment>;
    }

    return (
        <TextField
            {...textFieldProps}
            inputRef={setInputRef}
            value={display}
            onChange={handleChange}
            onPaste={handlePaste}
            onBlur={handleBlur}
            type="text"
            error={!!notice || error}
            helperText={notice ?? helperText}
            slotProps={{
                ...(slotProps as any),
                input: inputSlotProps,
                htmlInput: {
                    inputMode: options.decimals > 0 ? "decimal" : "numeric",
                    ...((slotProps?.htmlInput as any) || {}),
                },
            }}
        />
    );
}

export default MoneyTextField;

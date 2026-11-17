import { forwardRef } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { IMaskInput } from "react-imask";

// Mascara dinamica: CPF (11 digitos) ou CNPJ (14 digitos)
const CPF_MASK = "000.000.000-00";
const CNPJ_MASK = "00.000.000/0000-00";
const CPF_OU_CNPJ_MASK = [{ mask: CPF_MASK }, { mask: CNPJ_MASK }];

const CpfCnpjMask = forwardRef<HTMLInputElement, any>(({ mask, ...props }, ref) => (
  <IMaskInput
    {...props}
    mask={mask ?? CPF_OU_CNPJ_MASK}
    placeholderChar="_"
    // CASO NAO TENHA NADA DIGITADO NAO MOSTRA O PLACEHOLDER
    lazy={!props.value}
    inputRef={ref}
    onAccept={(value: string) => props.onChange({ target: { value } })}
  />
));
CpfCnpjMask.displayName = "CpfCnpjMask";

export type CpfCnpjTipo = "cpf" | "cnpj";

const getMask = (tipo?: CpfCnpjTipo) => {
  if (tipo === "cpf") return CPF_MASK;
  if (tipo === "cnpj") return CNPJ_MASK;
  return CPF_OU_CNPJ_MASK;
};

type CpfCnpjTextFieldProps = Omit<TextFieldProps, "onChange"> & {
  onChange?: (value: string) => void;
  value?: string | null;
  /** Restringe a mascara a CPF ou a CNPJ. Sem valor, aceita os dois (mascara dinamica). */
  tipo?: CpfCnpjTipo;
};

export function CpfCnpjTextField({
  onChange,
  value,
  tipo,
  slotProps,
  ...props
}: CpfCnpjTextFieldProps) {
  return (
    <TextField
      {...props}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      slotProps={{
        ...slotProps,
        input: { inputComponent: CpfCnpjMask as any, ...(slotProps?.input as any) },
        htmlInput: { mask: getMask(tipo), ...(slotProps?.htmlInput as any) },
      }}
    />
  );
}

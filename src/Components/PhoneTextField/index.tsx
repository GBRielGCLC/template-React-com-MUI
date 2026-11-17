import { forwardRef } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { IMaskInput } from "react-imask";

const PhoneMask = forwardRef<HTMLInputElement, any>((props, ref) => (
  <IMaskInput
    {...props}
    mask="(00) 9 0000-0000"
    placeholderChar="_"
    // CASO NÃO TENHA NADA DIGITADO NÃO MOSTRA O PLACEHOLDER
    lazy={!props.value}
    inputRef={ref}
    onAccept={(value: string) => props.onChange({ target: { value } })}
  />
));
PhoneMask.displayName = "PhoneMask";

type PhoneTextFieldProps = Omit<TextFieldProps, "onChange"> & {
  onChange?: (value: string) => void;
  value?: string | null;
};

export function PhoneTextField({ onChange, value, ...props }: PhoneTextFieldProps) {
  return (
    <TextField
      {...props}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      slotProps={{ input: { inputComponent: PhoneMask as any, ...(props.slotProps?.input as any) } }}
    />
  );
}

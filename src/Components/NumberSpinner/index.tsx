import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import OutlinedInput from '@mui/material/OutlinedInput';

export default function NumberSpinner({
  id: idProp,
  label,
  error,
  size = 'small',
  fullWidth,
  ...other
}: BaseNumberField.Root.Props & {
  label?: React.ReactNode;
  size?: 'small' | 'medium';
  error?: boolean;
  fullWidth?: boolean;
}) {
  let id = React.useId();
  if (idProp) id = idProp;

  const isSmall = size === 'small';

  return (
    <BaseNumberField.Root
      {...other}
      render={(props, state) => (
        <FormControl
          size={size}
          ref={props.ref}
          disabled={state.disabled}
          required={state.required}
          error={error}
          variant="outlined"
          sx={{
            gap: 0.5,
            opacity: state.disabled ? 0.65 : 1,
            transition: 'opacity 0.2s',
            width: fullWidth ? '100%' : undefined,
          }}
        >
          {label && (
            <FormLabel
              htmlFor={id}
              sx={{
                fontSize: '0.75rem',
                color: error ? 'error.main' : state.disabled ? 'text.disabled' : 'text.secondary',
                lineHeight: 1,
              }}
            >
              {label}
            </FormLabel>
          )}
          <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
            <BaseNumberField.Decrement
              render={
                <Button
                  variant="outlined"
                  aria-label="Decrease"
                  size="small"
                  color="error"
                  sx={{
                    minWidth: 32,
                    px: isSmall ? 0.75 : 1.25,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderColor: 'divider',
                    '&.Mui-disabled': {
                      borderRight: 0,
                      bgcolor: 'action.disabledBackground',
                    },
                    '&:not(.Mui-disabled):hover': {
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                      borderColor: 'error.main',
                    },
                  }}
                />
              }
            >
              <RemoveIcon fontSize="small" />
            </BaseNumberField.Decrement>

            <BaseNumberField.Input
              id={id}
              render={(inputProps, inputState) => (
                <OutlinedInput
                  inputRef={inputProps.ref}
                  value={inputState.inputValue}
                  onBlur={inputProps.onBlur}
                  onChange={inputProps.onChange}
                  onKeyUp={inputProps.onKeyUp}
                  onKeyDown={inputProps.onKeyDown}
                  onFocus={inputProps.onFocus}
                  slotProps={{
                    input: {
                      ...inputProps,
                      size: Math.max(
                        (other.min?.toString() || '').length,
                        inputState.inputValue.length || 1,
                      ) + 1,
                      sx: {
                        textAlign: 'center',
                        px: 1,
                        py: isSmall ? 0.5 : 0.75,
                      },
                    },
                  }}
                  sx={{
                    borderRadius: 0,
                    flex: 1,
                    minWidth: 60,
                    bgcolor: state.disabled ? 'action.disabledBackground' : 'transparent',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderLeft: 0,
                      borderRight: 0,
                      borderRadius: 0,
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground',
                    },
                  }}
                />
              )}
            />

            <BaseNumberField.Increment
              render={
                <Button
                  variant="outlined"
                  aria-label="Increase"
                  size="small"
                  color="success"
                  sx={{
                    minWidth: 32,
                    px: isSmall ? 0.75 : 1.25,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderColor: 'divider',
                    '&.Mui-disabled': {
                      borderLeft: 0,
                      bgcolor: 'action.disabledBackground',
                    },
                    '&:not(.Mui-disabled):hover': {
                      bgcolor: 'success.main',
                      color: 'success.contrastText',
                      borderColor: 'success.main',
                    },
                  }}
                />
              }
            >
              <AddIcon fontSize="small" />
            </BaseNumberField.Increment>
          </Box>
        </FormControl>
      )}
    />
  );
}

import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import { ContentCopy, Visibility, VisibilityOff } from '@mui/icons-material';
import { toastManager } from '../../Services/ToastUtils';

interface ParticipantTokenDialogProps {
    open: boolean;
    /** Monta a URL de acesso `/join?event=...&token=...`. */
    eventId: string;
    name: string;
    token: string;
    onClose: () => void;
}

/**
 * Exibe o link de acesso do participante — o accessToken só é devolvido pela
 * API na criação ou rotação, então o link (que o embute) não pode ser
 * recuperado depois: o aviso é obrigatório.
 */
export const ParticipantTokenDialog = ({ open, eventId, name, token, onClose }: ParticipantTokenDialogProps) => {
    const [visible, setVisible] = useState(false);

    // URL de entrada do participante (a página /join valida o token).
    const joinUrl = `${window.location.origin}/join?event=${encodeURIComponent(eventId)}&token=${encodeURIComponent(token)}`;

    useEffect(() => {
        if (open) setVisible(false);
    }, [open]);

    const handleCopy = () => {
        navigator.clipboard.writeText(joinUrl)
            .then(() => toastManager.success('Link de acesso copiado!'))
            .catch(() => toastManager.error('Não foi possível copiar.'));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Link de acesso de {name}</DialogTitle>

            <DialogContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Guarde este link agora.</strong> Por segurança, ele não poderá ser
                    consultado novamente — se for perdido, será preciso gerar um novo
                    (invalidando este).
                </Alert>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Com este link, {name} acessa o evento como participante: registra despesas,
                    informa pagamentos e vê os saldos.
                </Typography>

                <TextField
                    fullWidth
                    value={joinUrl}
                    sx={{ mt: 2 }}
                    onFocus={(e) => e.currentTarget.select()}
                    slotProps={{
                        input: {
                            readOnly: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconButton size="small" onClick={handleCopy}>
                                        <ContentCopy fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setVisible((v) => !v)}
                                        aria-label={visible ? 'Ocultar link' : 'Exibir link'}
                                    >
                                        {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                    type={visible ? 'text' : 'password'}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleCopy} variant="outlined" startIcon={<ContentCopy />}>
                    Copiar
                </Button>
                <Button onClick={onClose} variant="contained">
                    Entendi, salvei
                </Button>
            </DialogActions>
        </Dialog>
    );
};

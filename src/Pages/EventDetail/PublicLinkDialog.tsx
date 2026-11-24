import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Skeleton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { ContentCopy, Link as LinkIcon, PowerSettingsNew, Sync } from '@mui/icons-material';
import { EventsService } from '../../Services/Api/Events/EventsService';
import { EventDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';
import { toastManager } from '../../Services/ToastUtils';

interface PublicLinkDialogProps {
    open: boolean;
    event: EventDto;
    onClose: () => void;
    /** Mudou o estado `publicLinkEnabled` do evento (enable/disable). */
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Gerencia o link público (somente leitura) do evento.
 *
 * O token cru só é devolvido pela API em **enable/rotate** — se a página
 * recarregar com o link já ativo, o endereço anterior não pode ser
 * recuperado; nesse caso oferecemos rotacionar (invalida o antigo) ou
 * desabilitar.
 */
export const PublicLinkDialog = ({ open, event, onClose, onEnabledChange }: PublicLinkDialogProps) => {
    const [enabled, setEnabled] = useState(event.publicLinkEnabled);
    // URL gerada nesta sessão (null = link ativo de antes, endereço desconhecido).
    const [url, setUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (open) {
            setEnabled(event.publicLinkEnabled);
            setUrl(null);
        }
    }, [open, event.publicLinkEnabled]);

    const buildUrl = (token: string) => `${window.location.origin}/public/${token}`;

    const handleEnable = async () => {
        setBusy(true);
        try {
            const link = await EventsService.EnablePublicLink(event.id);
            setUrl(buildUrl(link.token));
            setEnabled(true);
            onEnabledChange(true);
            toastManager.success(url ? 'Novo link público gerado!' : 'Link público ativado!');
        } catch (err) {
            toastManager.error(toApiError(err).message);
        } finally {
            setBusy(false);
        }
    };

    const handleDisable = () => {
        setBusy(true);
        EventsService.DisablePublicLink(event.id)
            .then(() => {
                setEnabled(false);
                setUrl(null);
                onEnabledChange(false);
                toastManager.success('Link público desativado.');
                onClose();
            })
            .catch((err) => {
                // 409 public_link.not_enabled
                toastManager.error(toApiError(err).message);
            })
            .finally(() => setBusy(false));
    };

    const handleCopy = () => {
        if (!url) return;
        navigator.clipboard.writeText(url)
            .then(() => toastManager.success('Link público copiado!'))
            .catch(() => toastManager.error('Não foi possível copiar.'));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Link público do evento</DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {!enabled && (
                        <Alert severity="info" variant="outlined">
                            Com o link público ligado, <strong>qualquer pessoa com o endereço</strong> vê uma
                            página somente leitura do evento (despesas, saldos, acertos e chaves Pix).
                            Despesas e pagamentos continuam protegidos.
                        </Alert>
                    )}

                    {enabled && !url && (
                        <Alert severity="warning" variant="outlined">
                            O link está <strong>ativo</strong>, mas o endereço não pode ser recuperado por
                            segurança (ele só é exibido no momento da geração). Se você não o guardou,
                            gere um novo — <strong>o endereço antigo deixa de funcionar</strong>.
                        </Alert>
                    )}

                    {url && (
                        <>
                            <Typography variant="subtitle2">
                                Compartilhe este endereço — ele abre a página somente leitura do evento:
                            </Typography>
                            <TextField
                                value={url}
                                fullWidth
                                size="small"
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={handleCopy} edge="end">
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <Alert severity="warning" variant="outlined">
                                O endereço é um <strong>segredo</strong> (a página mostra chaves Pix). Não o
                                publique em lugar aberto. Rotacionar invalida este link.
                            </Alert>
                        </>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {!enabled && (
                            <Button
                                variant="contained"
                                startIcon={busy ? undefined : <LinkIcon />}
                                onClick={handleEnable}
                                disabled={busy}
                            >
                                Gerar link público
                            </Button>
                        )}
                        {enabled && (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<Sync />}
                                    onClick={handleEnable}
                                    disabled={busy}
                                >
                                    {url ? 'Gerar novo link' : 'Rotacionar link'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<PowerSettingsNew />}
                                    onClick={handleDisable}
                                    disabled={busy}
                                >
                                    Desabilitar
                                </Button>
                            </>
                        )}
                    </Box>

                    {busy && <Skeleton variant="rectangular" height={4} />}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={busy} color="secondary">
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { useAuth } from '../../Contexts/AuthContext';
import { ParticipantsService } from '../../Services/Api/Participants/ParticipantsService';
import { toApiError } from '../../Services/Api/Errors';

/**
 * Entrada do participante: `/join?event=<eventId>&token=<accessToken>`.
 *
 * O accessToken só existe uma vez (criação/rotação) — o admin compartilha
 * esta URL. A página valida o token via `GET /participants/me` (só PT),
 * salva a sessão no TokenStore e leva para a tela do evento.
 *
 * Os dois headers (JWT + PT) nunca devem coexistir (a API define identidade
 * por header): se há usuário logado, oferecemos a troca explícita de sessão.
 */
export const Join = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        isAuthenticated,
        user,
        logout,
        joinAsParticipant,
        leaveParticipant,
    } = useAuth();

    const eventId = searchParams.get('event');
    const token = searchParams.get('token');

    const [error, setError] = useState<string | null>(null);
    const [entering, setEntering] = useState(false);
    // Evita dupla tentativa em StrictMode (o effect roda 2x no dev).
    const attemptedRef = useRef<string | null>(null);

    const enterAsParticipant = useCallback(() => {
        if (!eventId || !token) return;

        setEntering(true);
        setError(null);

        // Persiste antes da chamada: o interceptor lê o header do TokenStore.
        joinAsParticipant(eventId, token);

        ParticipantsService.Me(eventId)
            .then((me) => {
                // Guarda o "eu" do participante (id/nome) para a tela do evento.
                sessionStorage.setItem('participantId', me.participant.id);
                sessionStorage.setItem('participantName', me.participant.name);
                navigate(`/events/${eventId}`, { replace: true });
            })
            .catch((err) => {
                const apiError = toApiError(err);
                leaveParticipant();
                sessionStorage.removeItem('participantId');
                sessionStorage.removeItem('participantName');

                if (apiError.status === 401 || apiError.status === 403) {
                    setError('Este link de acesso não é mais válido. Gere um novo link com o organizador do evento.');
                } else if (apiError.status === 0) {
                    setError('Não foi possível validar o link. Verifique sua conexão e tente novamente.');
                } else {
                    setError(apiError.message);
                }
                setEntering(false);
            });
    }, [eventId, token, joinAsParticipant, leaveParticipant, navigate]);

    useEffect(() => {
        if (!eventId || !token) {
            setError('Este link de acesso está incompleto. Peça um novo link ao organizador do evento.');
            return;
        }

        const attemptKey = `${eventId}:${token}`;
        if (attemptedRef.current === attemptKey) return;
        attemptedRef.current = attemptKey;

        // Logado → não entra automaticamente: o usuário escolhe a sessão.
        if (isAuthenticated) return;

        enterAsParticipant();
    }, [eventId, token, isAuthenticated, enterAsParticipant]);

    const switchSession = () => {
        // Encerra a sessão de usuário antes de entrar como participante —
        // evita enviar JWT e X-Participant-Token na mesma request.
        // (O effect já marcou a tentativa; só entra de novo aqui.)
        logout();
        enterAsParticipant();
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                bgcolor: 'background.default',
            }}
        >
            <Stack alignItems="center" spacing={2} sx={{ maxWidth: 460, textAlign: 'center' }}>
                <EventIcon sx={{ fontSize: 64, color: 'primary.main' }} />

                {error && !entering ? (
                    <>
                        <Typography variant="h5" fontWeight={600}>
                            Link de acesso
                        </Typography>
                        <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                            {error}
                        </Alert>
                        <Button variant="contained" onClick={() => navigate('/')}>
                            Ir para o início
                        </Button>
                    </>
                ) : isAuthenticated && !entering ? (
                    <>
                        <Typography variant="h5" fontWeight={600}>
                            Você está logado no Quitta
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Olá, {user?.name}. Este link abre o evento na visão de <strong>participante</strong>,
                            o que encerra sua sessão atual. O que deseja fazer?
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Button variant="outlined" onClick={() => navigate('/events')}>
                                Continuar como admin
                            </Button>
                            <Button variant="contained" onClick={switchSession}>
                                Entrar como participante
                            </Button>
                        </Stack>
                    </>
                ) : (
                    <>
                        <Typography variant="h5" fontWeight={600}>
                            Entrando no evento...
                        </Typography>
                        <Stack alignItems="center" spacing={1.5}>
                            <CircularProgress size={32} />
                            <Typography variant="body2" color="text.secondary">
                                Validando seu link de acesso.
                            </Typography>
                        </Stack>
                    </>
                )}
            </Stack>
        </Box>
    );
};

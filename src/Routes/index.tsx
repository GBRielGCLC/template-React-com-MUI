import { Routes, Route, Navigate } from 'react-router-dom';
import { NotFound } from '../Pages/NotFound';
import { Events } from '../Pages/Events';
import { EventDetail } from '../Pages/EventDetail';
import { Join } from '../Pages/Join';
import { PublicEventPage } from '../Pages/PublicEvent';
import { Admin } from '../Pages/Admin';
import { Invite } from '../Pages/Invite';
import { useAuth } from '../Contexts/AuthContext';

export const AppRoutes = () => {
    const { isAuthenticated, participantEventId } = useAuth();

    // Participante (sem usuário logado) não pode listar eventos
    // (`403 event.user_required`) — manda direto para o evento dele.
    const myEvent = !isAuthenticated && participantEventId
        ? `/events/${participantEventId}`
        : null;

    return (
        <Routes>
            <Route path="/" element={<Navigate to={myEvent ?? '/events'} replace />} />
            {/* Compatibilidade: a home virou a lista de eventos. */}
            <Route path="/home" element={<Navigate to={myEvent ?? '/events'} replace />} />

            {/* Rotas sem login (renderizadas fora do layout — ver App.tsx). */}
            <Route path="/join" element={<Join />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/public/:token" element={<PublicEventPage />} />

            <Route
                path="/events"
                element={myEvent ? <Navigate to={myEvent} replace /> : <Events />}
            />
            <Route path="/events/:eventId" element={<EventDetail />} />

            {/* Admin de plataforma — a página valida `platform_admin`. */}
            <Route path="/admin" element={<Admin />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

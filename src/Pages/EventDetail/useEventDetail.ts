import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EventsService } from '../../Services/Api/Events/EventsService';
import { EventDto } from '../../Services/Api/Types';
import { toApiError } from '../../Services/Api/Errors';

/**
 * Carrega o evento da rota `/events/:eventId`.
 * `error` guarda o ApiError para a página decidir (404 → "não existe",
 * 403 → "sem acesso").
 */
export const useEventDetail = () => {
    const { eventId } = useParams<{ eventId: string }>();

    const [event, setEvent] = useState<EventDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ReturnType<typeof toApiError> | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    useEffect(() => {
        if (!eventId) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        EventsService.Get(eventId)
            .then((data) => {
                if (!cancelled) setEvent(data);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(toApiError(err));
                    setEvent(null);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [eventId, reloadKey]);

    return { eventId, event, loading, error, refresh, setEvent };
};

import {useCallback, useEffect, useRef, useState} from 'react';
import gameApi from './api.ts';
import {lastReadKey} from './chatUnread.ts';

/** How long marker writes coalesce before the server PUT goes out. */
const PUT_DEBOUNCE_MS = 3000;

/**
 * The viewer's last-read chat position for one game, synced with the
 * server-side marker so it follows the player across devices. localStorage
 * answers immediately and absorbs every write; the server is consulted once
 * on mount (adopted when this device has no local position — the server only
 * ever advances, so a local position is at least as fresh for this device)
 * and updated with debounced PUTs that flush when the page hides or unmounts.
 */
export function useLastRead(gameId: string) {
    // Frozen after initial resolution: the unread divider / digest anchor
    // doesn't chase the reader down the stream while they are looking at it.
    const [initialLastRead, setInitialLastRead] = useState<string | null>(() => localStorage.getItem(lastReadKey(gameId)));

    useEffect(() => {
        let cancelled = false;
        gameApi.getReadMarker(gameId)
            .then(({messageId}) => {
                if (cancelled || !messageId) return;
                if (!localStorage.getItem(lastReadKey(gameId))) {
                    localStorage.setItem(lastReadKey(gameId), messageId);
                    setInitialLastRead(messageId);
                }
            })
            .catch(() => {}); // cross-device sync is a nicety — localStorage carries on
        return () => { cancelled = true; };
    }, [gameId]);

    const readLastRead = useCallback(
        () => localStorage.getItem(lastReadKey(gameId)),
        [gameId],
    );

    const pendingPut = useRef<string | null>(null);
    const putTimer = useRef<number | null>(null);

    const flush = useCallback(() => {
        if (putTimer.current != null) {
            clearTimeout(putTimer.current);
            putTimer.current = null;
        }
        const messageId = pendingPut.current;
        if (messageId) {
            pendingPut.current = null;
            gameApi.setReadMarker(gameId, messageId).catch(() => {});
        }
    }, [gameId]);

    const markRead = useCallback((messageId: string) => {
        localStorage.setItem(lastReadKey(gameId), messageId);
        pendingPut.current = messageId;
        if (putTimer.current == null) {
            putTimer.current = window.setTimeout(() => {
                putTimer.current = null;
                const pending = pendingPut.current;
                if (pending) {
                    pendingPut.current = null;
                    gameApi.setReadMarker(gameId, pending).catch(() => {});
                }
            }, PUT_DEBOUNCE_MS);
        }
    }, [gameId]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') flush();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            flush();
        };
    }, [flush]);

    return {initialLastRead, readLastRead, markRead};
}

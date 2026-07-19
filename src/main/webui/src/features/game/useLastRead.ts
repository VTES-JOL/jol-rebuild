import {useCallback, useState} from 'react';
import {lastReadKey} from './chatUnread.ts';

/**
 * The viewer's last-read chat position for one game. localStorage-backed for
 * now; the server-side marker from the blueprint's Gaps table upgrades this
 * hook to follow the player across devices without changing consumers.
 */
export function useLastRead(gameId: string) {
    // Frozen at mount: the unread divider / digest anchor doesn't chase the
    // reader down the stream while they are looking at it.
    const [initialLastRead] = useState<string | null>(() => localStorage.getItem(lastReadKey(gameId)));

    const readLastRead = useCallback(
        () => localStorage.getItem(lastReadKey(gameId)),
        [gameId],
    );

    const markRead = useCallback((messageId: string) => {
        localStorage.setItem(lastReadKey(gameId), messageId);
    }, [gameId]);

    return {initialLastRead, readLastRead, markRead};
}

import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';

/**
 * The viewer's last-read position, per game. localStorage is the interim
 * store until the server-side marker from the blueprint's Gaps table exists
 * (docs/implementation/board-design.md).
 */
export const lastReadKey = (gameId: string) => `jol.game.${gameId}.lastRead`;

/** Talk messages from other players after the last-read position — log lines don't count. */
export function unreadTalkCount(
    messages: (ChatMsg | CommandLogMsg)[],
    lastReadId: string | null,
    currentUser: string,
): number {
    const idx = lastReadId ? messages.findIndex(m => m.id === lastReadId) : -1;
    return messages.slice(idx + 1)
        .filter(m => m.type === 'CHAT' && m.sender !== currentUser).length;
}

import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';

/**
 * The "since you left" reconnect digest, compiled client-side from the
 * effect-log slice the server returns for `GET /messages/since`
 * (docs/implementation/board-design.md — Now panel, async digest).
 * Structured command logs are used directly — no string parsing.
 */
export type SinceDigest = {
    /** Players ousted while the viewer was away, in oust order. */
    ousts: string[];
    /** Pool-setting events aimed at the viewer. */
    poolChanges: number;
    /** Turns that started while away. */
    turnsAdvanced: number;
    /** Talk messages from other players. */
    talkCount: number;
    /** The slice hit the server cap — there is more history than shown. */
    truncated: boolean;
};

/** Matches the server-side cap in ChatService.SINCE_LIMIT. */
export const SINCE_LIMIT = 500;

export function compileDigest(messages: (ChatMsg | CommandLogMsg)[], viewer: string): SinceDigest | null {
    const digest: SinceDigest = {
        ousts: [],
        poolChanges: 0,
        turnsAdvanced: 0,
        talkCount: 0,
        truncated: messages.length >= SINCE_LIMIT,
    };

    for (const msg of messages) {
        if (msg.type === 'CHAT') {
            if (msg.sender !== viewer) digest.talkCount++;
            continue;
        }
        const command = msg.commandLog?.command;
        if (!command) continue;
        switch (command.commandType) {
            case 'OUST_PLAYER':
                digest.ousts.push(command.oustedPlayer);
                break;
            case 'SET_POOL':
                if (command.targetPlayer === viewer) digest.poolChanges++;
                break;
            case 'NEXT_TURN':
                digest.turnsAdvanced++;
                break;
        }
    }

    const noteworthy = digest.ousts.length > 0 || digest.poolChanges > 0
        || digest.turnsAdvanced > 0 || digest.talkCount > 0 || digest.truncated;
    return noteworthy ? digest : null;
}

/** Human-readable digest fragments, most important first. */
export function digestLines(digest: SinceDigest): string[] {
    const s = (n: number) => n === 1 ? '' : 's';
    const lines: string[] = [];
    if (digest.ousts.length > 0) lines.push(`ousted: ${digest.ousts.join(', ')}`);
    if (digest.turnsAdvanced > 0) lines.push(`${digest.turnsAdvanced} turn${s(digest.turnsAdvanced)} passed`);
    if (digest.poolChanges > 0) lines.push(`your pool changed ${digest.poolChanges} time${s(digest.poolChanges)}`);
    if (digest.talkCount > 0) lines.push(`${digest.talkCount} chat message${s(digest.talkCount)}`);
    if (digest.truncated) lines.push('and more…');
    return lines;
}

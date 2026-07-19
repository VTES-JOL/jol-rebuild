import {describe, expect, it} from 'vitest';
import {unreadTalkCount} from '../features/game/chatUnread.ts';
import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';

const talk = (id: string, sender: string): ChatMsg =>
    ({type: 'CHAT', id, sender, content: `msg ${id}`, timestamp: '2026-07-19T12:00:00Z', reactions: []});

const log = (id: string): CommandLogMsg => ({
    type: 'COMMAND_LOG', id, sender: 'system', content: 'draws a card', timestamp: '2026-07-19T12:00:00Z', reactions: [],
    commandLog: {turn: '2.3', phase: 'MINION', currentPlayer: 'Ana', command: {commandType: 'DRAW_CARD', actor: 'Ana', count: 1}} as CommandLogMsg['commandLog'],
});

const stream = [talk('1', 'Ana'), log('2'), talk('3', 'Ben'), talk('4', 'Cat'), log('5')];

describe('unreadTalkCount', () => {
    it('counts talk from others after the last-read message', () => {
        expect(unreadTalkCount(stream, '1', 'Cat')).toBe(1); // Ben only — Cat's own message doesn't count
    });

    it('ignores log lines', () => {
        expect(unreadTalkCount(stream, '3', 'Ana')).toBe(1); // Cat's talk; the trailing log doesn't count
    });

    it('counts the whole stream with no last-read', () => {
        expect(unreadTalkCount(stream, null, 'Dev')).toBe(3);
    });

    it('treats an unknown last-read id as never-read', () => {
        expect(unreadTalkCount(stream, 'gone', 'Dev')).toBe(3);
    });

    it('reports zero when caught up', () => {
        expect(unreadTalkCount(stream, '5', 'Dev')).toBe(0);
    });
});

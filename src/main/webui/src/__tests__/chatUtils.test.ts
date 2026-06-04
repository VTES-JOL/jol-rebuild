import {describe, expect, it} from 'vitest';
import {groupMessages} from '@/features/chat/chatUtils';
import type {ChatMsg} from '@/hooks/useWebSocket';

function msg(id: string, sender: string, timestamp: string, content = 'hi', replyTo?: ChatMsg['replyTo']): ChatMsg {
    return { type: 'CHAT', id, sender, content, timestamp, reactions: [], replyTo };
}

// Two timestamps within the same minute (same formatted time string)
const T1 = '2024-06-15T10:00:00Z';
const T2 = '2024-06-15T10:00:30Z';
// A timestamp on a different day
const T3 = '2024-06-16T10:00:00Z';

describe('groupMessages', () => {
    it('returns empty array for no messages', () => {
        expect(groupMessages([], 'alice')).toEqual([]);
    });

    it('creates a single group for one message', () => {
        const groups = groupMessages([msg('1', 'alice', T1)], 'alice');
        expect(groups).toHaveLength(1);
        expect(groups[0].sender).toBe('alice');
        expect(groups[0].lines).toHaveLength(1);
        expect(groups[0].isSelf).toBe(true);
    });

    it('sets isSelf=false for messages not from current user', () => {
        const groups = groupMessages([msg('1', 'bob', T1)], 'alice');
        expect(groups[0].isSelf).toBe(false);
    });

    it('merges consecutive messages from the same sender in the same time window', () => {
        const messages = [
            msg('1', 'alice', T1, 'first'),
            msg('2', 'alice', T2, 'second'),
        ];
        const groups = groupMessages(messages, 'other');
        expect(groups).toHaveLength(1);
        expect(groups[0].lines).toHaveLength(2);
        expect(groups[0].lines[0].content).toBe('first');
        expect(groups[0].lines[1].content).toBe('second');
    });

    it('starts a new group when the sender changes', () => {
        const messages = [
            msg('1', 'alice', T1),
            msg('2', 'bob', T2),
        ];
        const groups = groupMessages(messages, 'alice');
        expect(groups).toHaveLength(2);
        expect(groups[0].sender).toBe('alice');
        expect(groups[1].sender).toBe('bob');
    });

    it('starts a new group when the timestamp crosses a display boundary', () => {
        const messages = [
            msg('1', 'alice', T1),
            msg('2', 'alice', T3),
        ];
        const groups = groupMessages(messages, 'alice');
        expect(groups).toHaveLength(2);
    });

    it('sets dividerTimestamp only on the first group and on day changes', () => {
        const messages = [
            msg('1', 'alice', T1),
            msg('2', 'alice', T2),
            msg('3', 'alice', T3),
        ];
        const groups = groupMessages(messages, 'alice');
        // First group always gets a divider
        expect(groups[0].dividerTimestamp).not.toBeNull();
        // Second group on a different day gets a new divider
        expect(groups[1].dividerTimestamp).not.toBeNull();
    });

    it('starts a new group for a message with replyTo even if same sender/time', () => {
        const messages = [
            msg('1', 'alice', T1, 'first'),
            msg('2', 'alice', T2, 'with reply', { id: '0', sender: 'bob', content: 'original' }),
        ];
        const groups = groupMessages(messages, 'other');
        expect(groups).toHaveLength(2);
    });

    it('includes replyTo in the message line', () => {
        const reply = { id: '0', sender: 'bob', content: 'original' };
        const messages = [msg('1', 'alice', T1, 'hi', reply)];
        const groups = groupMessages(messages, 'alice');
        expect(groups[0].lines[0].replyTo).toEqual(reply);
    });

    it('sets replyTo=null on messages without a reply', () => {
        const messages = [msg('1', 'alice', T1)];
        const groups = groupMessages(messages, 'alice');
        expect(groups[0].lines[0].replyTo).toBeNull();
    });
});

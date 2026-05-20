import { describe, it, expect } from 'vitest';
import { applyOptimisticReaction } from '@/shared/utils/reactionUtils';
import type { ChatMsg } from '@/hooks/useWebSocket';

function chatMsg(id: string, reactions: ChatMsg['reactions'] = []): ChatMsg {
    return { type: 'CHAT', id, sender: 'alice', content: 'hi', timestamp: '2024-01-01T00:00:00Z', reactions };
}

describe('applyOptimisticReaction', () => {
    it('adds a new reaction when the emoji does not exist yet', () => {
        const messages = [chatMsg('1')];
        const result = applyOptimisticReaction(messages, '1', '👍', 'alice');
        expect(result[0].reactions).toEqual([{ emoji: '👍', senders: ['alice'] }]);
    });

    it('adds sender to an existing reaction when they have not reacted', () => {
        const messages = [chatMsg('1', [{ emoji: '👍', senders: ['bob'] }])];
        const result = applyOptimisticReaction(messages, '1', '👍', 'alice');
        expect(result[0].reactions[0].senders).toContain('alice');
        expect(result[0].reactions[0].senders).toContain('bob');
    });

    it('removes the sender when they have already reacted with that emoji', () => {
        const messages = [chatMsg('1', [{ emoji: '👍', senders: ['alice', 'bob'] }])];
        const result = applyOptimisticReaction(messages, '1', '👍', 'alice');
        expect(result[0].reactions[0].senders).not.toContain('alice');
        expect(result[0].reactions[0].senders).toContain('bob');
    });

    it('removes the reaction entirely when the last sender un-reacts', () => {
        const messages = [chatMsg('1', [{ emoji: '👍', senders: ['alice'] }])];
        const result = applyOptimisticReaction(messages, '1', '👍', 'alice');
        expect(result[0].reactions).toHaveLength(0);
    });

    it('does not modify messages with a different id', () => {
        const messages = [chatMsg('1'), chatMsg('2', [{ emoji: '❤️', senders: ['bob'] }])];
        const result = applyOptimisticReaction(messages, '1', '👍', 'alice');
        expect(result[1].reactions).toEqual([{ emoji: '❤️', senders: ['bob'] }]);
    });

    it('preserves other emoji reactions when toggling one', () => {
        const messages = [
            chatMsg('1', [
                { emoji: '👍', senders: ['alice'] },
                { emoji: '❤️', senders: ['bob'] },
            ]),
        ];
        const result = applyOptimisticReaction(messages, '1', '👍', 'alice');
        expect(result[0].reactions).toHaveLength(1);
        expect(result[0].reactions[0].emoji).toBe('❤️');
    });

    it('returns a new array (does not mutate input)', () => {
        const messages = [chatMsg('1')];
        const result = applyOptimisticReaction(messages, '1', '👍', 'alice');
        expect(result).not.toBe(messages);
        expect(result[0]).not.toBe(messages[0]);
    });
});

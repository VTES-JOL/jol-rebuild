import type {ChatMsg, ReactionDto} from '@/hooks/useWebSocket.ts';

/**
 * Applies an optimistic toggle of an emoji reaction for a given user on a message.
 * If the user has already reacted with this emoji, their reaction is removed;
 * otherwise it is added. Reactions with no senders remaining are filtered out.
 */
export function applyOptimisticReaction(
    messages: ChatMsg[],
    messageId: string,
    emoji: string,
    username: string
): ChatMsg[] {
    return messages.map(m => {
        if (m.id !== messageId) return m;
        const reactions: ReactionDto[] = m.reactions;
        const existing = reactions.find(r => r.emoji === emoji);
        if (existing) {
            const alreadyReacted = existing.senders.includes(username);
            return {
                ...m,
                reactions: alreadyReacted
                    ? reactions
                        .map(r => r.emoji !== emoji ? r : {
                            ...r, senders: r.senders.filter(s => s !== username),
                        })
                        .filter(r => r.senders.length > 0)
                    : reactions.map(r => r.emoji !== emoji ? r : {
                        ...r, senders: [...r.senders, username],
                    }),
            };
        }
        return {...m, reactions: [...reactions, {emoji, senders: [username]}]};
    });
}

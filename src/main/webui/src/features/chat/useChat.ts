import { useCallback, useState } from 'react';
import { type ChatMessage, useWebSocket } from './useWebSocket';

interface UseChatOptions {
    url: string;
    username: string;
    onSystemError?: (error: string) => void;
}

export function useChat({ url, username, onSystemError }: UseChatOptions) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const handleMessage = useCallback((msg: ChatMessage) => {
        switch (msg.type) {
            case 'HISTORY':
                setMessages(msg.history ?? []);
                break;
            case 'CHAT':
                setMessages(prev => [...prev, msg]);
                break;
            case 'REACTION':
                // Server broadcasts the full updated reaction list for a message.
                setMessages(prev => prev.map(m =>
                    m.id === msg.id ? { ...m, reactions: msg.reactions } : m
                ));
                break;
            case 'ERROR':
                console.warn('[Chat] Server error:', msg.error);
                if (onSystemError && msg.error) onSystemError(msg.error);
                break;
        }
    }, [onSystemError]);

    const { status, send } = useWebSocket({ url, onMessage: handleMessage });

    const handleSend = useCallback((content: string, replyToId?: number) => {
        send({ type: 'CHAT', content, replyToId });
    }, [send]);

    const handleReact = useCallback((messageId: number, emoji: string) => {
        // Optimistic update — toggle locally before the server round-trip
        setMessages(prev => prev.map(m => {
            if (m.id !== messageId) return m;
            const reactions = m.reactions ?? [];
            const existing = reactions.find(r => r.emoji === emoji);
            if (existing) {
                const alreadyReacted = existing.senders.includes(username);
                return {
                    ...m,
                    reactions: alreadyReacted
                        ? reactions.map(r => r.emoji !== emoji ? r : {
                            ...r, senders: r.senders.filter(s => s !== username),
                        }).filter(r => r.senders.length > 0)
                        : reactions.map(r => r.emoji !== emoji ? r : {
                            ...r, senders: [...r.senders, username],
                        }),
                };
            }
            return { ...m, reactions: [...reactions, { emoji, senders: [username] }] };
        }));

        send({ type: 'REACTION', id: messageId, emoji });
    }, [send, username]);

    return {
        messages,
        status,
        send: handleSend,
        react: handleReact,
    };
}

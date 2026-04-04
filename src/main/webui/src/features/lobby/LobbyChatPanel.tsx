import { useCallback, useState } from 'react';
import { ChatPanel } from '@/shared/components/ChatPanel';
import { type ChatMessage, useWebSocket } from '@/shared/services/useWebSocket';

interface LobbyChatPanelProps {
    /** The logged-in user's username */
    username: string;
}

export function LobbyChatPanel({ username }: LobbyChatPanelProps) {
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
                // Find it by id and swap in the new reactions array.
                setMessages(prev => prev.map(m =>
                    m.id === msg.id ? { ...m, reactions: msg.reactions } : m
                ));
                break;
            case 'ERROR':
                console.warn('[Lobby] Server error:', msg.error);
                break;
        }
    }, []);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/lobby`;

    const { status, send } = useWebSocket({ url, onMessage: handleMessage });

    const handleSend = (content: string, replyToId?: number) => {
        send({ type: 'CHAT', content, replyToId });
    };

    const handleReact = (messageId: number, emoji: string) => {
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
    };

    return (
        <ChatPanel
            title="Global Chat"
            messages={messages}
            status={status}
            currentUser={username}
            onSend={handleSend}
            onReact={handleReact}
            placeholder="Chat with everyone in the lobby…"
        />
    );
}
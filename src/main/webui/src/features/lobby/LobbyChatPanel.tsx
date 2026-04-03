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
                // Replace state with server-provided history on connect
                setMessages(msg.history ?? []);
                break;
            case 'CHAT':
                setMessages(prev => [...prev, msg]);
                break;
            case 'ERROR':
                console.warn('[Lobby] Server error:', msg.error);
                break;
            // PONG is handled silently (keepalive only)
        }
    }, []);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = `${protocol}//${window.location.host}`;
    const url = `${wsBaseUrl}/ws/lobby`;

    const { status, send } = useWebSocket({ url, onMessage: handleMessage });

    const handleSend = (content: string) => {
        send({ type: 'CHAT', content });
    };

    return (
        <ChatPanel
            title="Global Chat"
            messages={messages}
            status={status}
            currentUser={username}
            onSend={handleSend}
            placeholder="Chat with everyone in the lobby…"
        />
    );
}
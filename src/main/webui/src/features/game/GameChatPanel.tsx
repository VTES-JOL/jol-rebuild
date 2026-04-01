import { useCallback, useState } from 'react';
import { ChatPanel } from '@/shared/components/ChatPanel';
import { type ChatMessage, useWebSocket } from '@/shared/services/useWebSocket';

interface GameChatPanelProps {
    /** The logged-in user's username */
    username: string;
    /** The game room identifier (matches the {gameId} path param on the server) */
    gameId: string;
    /** Base WS URL, e.g. "ws://localhost:8080" */
    wsBaseUrl: string;
}

export function GameChatPanel({ username, gameId, wsBaseUrl }: GameChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const handleMessage = useCallback((msg: ChatMessage) => {
        switch (msg.type) {
            case 'HISTORY':
                setMessages(msg.history ?? []);
                break;
            case 'CHAT':
                setMessages(prev => [...prev, msg]);
                break;
            case 'ERROR':
                console.warn(`[Game ${gameId}] Server error:`, msg.error);
                break;
        }
    }, [gameId]);

    // Each game room is a distinct WS path — Quarkus scopes broadcasts to the path
    const url = `${wsBaseUrl}/ws/game/${encodeURIComponent(gameId)}`;
    const { status, send } = useWebSocket({ url, onMessage: handleMessage });

    const handleSend = (content: string) => {
        send({ type: 'CHAT', content });
    };

    return (
        <ChatPanel
            title="Game chat"
            messages={messages}
            status={status}
            currentUser={username}
            onSend={handleSend}
            placeholder="Chat with your opponents…"
        />
    );
}
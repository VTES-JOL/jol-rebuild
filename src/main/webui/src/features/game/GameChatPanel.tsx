import { useChat } from '@/features/chat/useChat';
import { ChatPanel } from '@/features/chat/ChatPanel';

interface GameChatPanelProps {
    /** The logged-in user's username */
    username: string;
    /** The game room identifier (matches the {gameId} path param on the server) */
    gameId: string;
}

export function GameChatPanel({ username, gameId }: GameChatPanelProps) {
    // Each game room is a distinct WS path — Quarkus scopes broadcasts to the path
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = `${protocol}//${window.location.host}`;
    const url = `${wsBaseUrl}/ws/game/${encodeURIComponent(gameId)}`;

    const { messages, status, send, react } = useChat({ url, username });

    return (
        <ChatPanel
            title="Game chat"
            messages={messages}
            status={status}
            currentUser={username}
            onSend={send}
            onReact={react}
            enableReactions={false}
            enableReply={false}
            placeholder="Chat with your opponents…"
        />
    );
}
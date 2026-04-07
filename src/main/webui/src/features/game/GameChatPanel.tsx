import {ChatPanel} from '@/features/chat/ChatPanel.tsx';

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

    return (
        <ChatPanel
            title="Game chat"
            url={url}
            currentUser={username}
            enableReactions={false}
            enableReply={false}
            placeholder="Chat with your opponents…"
        />
    );
}
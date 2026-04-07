import {ChatPanel} from '@/features/chat/ChatPanel.tsx';

interface LobbyChatPanelProps {
    /** The logged-in user's username */
    username: string;
}

export function LobbyChatPanel({ username }: LobbyChatPanelProps) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/lobby`;

    return (
        <ChatPanel
            title="Global Chat"
            url={url}
            currentUser={username}
            enableReactions={true}
            enableReply={true}
            placeholder="Chat with everyone in the lobby…"
        />
    );
}
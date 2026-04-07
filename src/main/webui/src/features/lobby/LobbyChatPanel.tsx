import { useChat } from '@/hooks/useChat.ts';
import { ChatPanel } from '@/features/chat/ChatPanel';

interface LobbyChatPanelProps {
    /** The logged-in user's username */
    username: string;
}

export function LobbyChatPanel({ username }: LobbyChatPanelProps) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/lobby`;

    const { messages, status, send, react } = useChat({ url, username });

    return (
        <ChatPanel
            title="Global Chat"
            messages={messages}
            status={status}
            currentUser={username}
            onSend={send}
            onReact={react}
            enableReactions={true}
            enableReply={true}
            placeholder="Chat with everyone in the lobby…"
        />
    );
}
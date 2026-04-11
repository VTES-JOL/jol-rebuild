import {ChatPanel} from '@/features/chat/ChatPanel.tsx';

interface Props {
    username: string;
}

export function GlobalChatPanel({username}: Props) {
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

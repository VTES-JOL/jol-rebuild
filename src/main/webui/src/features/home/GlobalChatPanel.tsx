import {ChatPanel} from '@/features/chat/ChatPanel.tsx';
import {useLobbySocket} from '@/features/lobby/LobbySocketContext.tsx';

interface Props {
    username: string;
}

export function GlobalChatPanel({username}: Props) {
    const {messages, status, send, react} = useLobbySocket();

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

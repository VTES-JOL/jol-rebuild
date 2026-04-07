import type { ChatMessage } from '@/hooks/useWebSocket.ts';
import { useChat } from '@/hooks/useChat.ts';
import { ChatPanelView } from './ChatPanelView.tsx';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

type LiveChatPanelProps = {
    title: string;
    url: string;
    currentUser: string;
    placeholder?: string;
    enableReactions?: boolean;
    enableReply?: boolean;
};

type ManualChatPanelProps = {
    title: string;
    messages: ChatMessage[];
    status: Status;
    currentUser: string;
    onSend: (content: string, replyToId?: number) => void;
    onReact: (messageId: number, emoji: string) => void;
    placeholder?: string;
    enableReactions?: boolean;
    enableReply?: boolean;
};

type ChatPanelProps = LiveChatPanelProps | ManualChatPanelProps;

function isLiveProps(props: ChatPanelProps): props is LiveChatPanelProps {
    return 'url' in props;
}

export function ChatPanel(props: ChatPanelProps) {
    if (isLiveProps(props)) {
        const {
            title,
            url,
            currentUser,
            placeholder = 'Type a message…',
            enableReactions = true,
            enableReply = true,
        } = props;

        const { messages, status, send, react } = useChat({
            url,
            username: currentUser,
        });

        return (
            <ChatPanelView
                title={title}
                status={status}
                messages={messages}
                currentUser={currentUser}
                onSend={send}
                onReact={react}
                placeholder={placeholder}
                enableReactions={enableReactions}
                enableReply={enableReply}
            />
        );
    }

    const {
        title,
        messages,
        status,
        currentUser,
        onSend,
        onReact,
        placeholder = 'Type a message…',
        enableReactions = true,
        enableReply = true,
    } = props;

    return (
        <ChatPanelView
            title={title}
            status={status}
            messages={messages}
            currentUser={currentUser}
            onSend={onSend}
            onReact={onReact}
            placeholder={placeholder}
            enableReactions={enableReactions}
            enableReply={enableReply}
        />
    );
}
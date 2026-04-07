import type { ChatMessage } from '@/hooks/useWebSocket.ts';
import { useChat } from '@/hooks/useChat.ts';
import { ChatPanelView } from './ChatPanelView.tsx';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

type BaseChatPanelProps = {
    title: string;
    currentUser: string;
    placeholder?: string;
    enableReactions?: boolean;
    enableReply?: boolean;
};

type LiveChatPanelProps = BaseChatPanelProps & {
    url: string;
};

type ManualChatPanelProps = BaseChatPanelProps & {
    messages: ChatMessage[];
    status: Status;
    onSend: (content: string, replyToId?: number) => void;
    onReact: (messageId: number, emoji: string) => void;
};

type ChatPanelProps = LiveChatPanelProps | ManualChatPanelProps;

function LiveChatPanel({
                           title,
                           url,
                           currentUser,
                           placeholder = 'Type a message…',
                           enableReactions = true,
                           enableReply = true,
                       }: LiveChatPanelProps) {
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

function ManualChatPanel({
                             title,
                             messages,
                             status,
                             currentUser,
                             onSend,
                             onReact,
                             placeholder = 'Type a message…',
                             enableReactions = true,
                             enableReply = true,
                         }: ManualChatPanelProps) {
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

export function ChatPanel(props: ChatPanelProps) {
    return 'url' in props ? <LiveChatPanel {...props} /> : <ManualChatPanel {...props} />;
}
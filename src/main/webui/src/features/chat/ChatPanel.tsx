import type {ChatMsg, CommandLogMsg} from '@/hooks/useWebSocket.ts';
import {useChat} from '@/hooks/useChat.ts';
import {ChatPanelView} from './ChatPanelView.tsx';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

type BaseChatPanelProps = {
    title: string;
    currentUser: string;
    placeholder?: string;
    enableReactions?: boolean;
    enableReply?: boolean;
    enableAvatars?: boolean;
    enableDivider?: boolean;
    enableCommandLogFilter?: boolean;
    chatDisabled?: boolean;
};

type LiveChatPanelProps = BaseChatPanelProps & {
    url: string;
};

type ManualChatPanelProps = BaseChatPanelProps & {
    messages: (ChatMsg | CommandLogMsg)[];
    status: Status;
    onSend: (content: string, replyToId?: string) => void;
    onReact: (messageId: string, emoji: string) => void;
};

type ChatPanelProps = LiveChatPanelProps | ManualChatPanelProps;

function LiveChatPanel({
                           title,
                           url,
                           currentUser,
                           placeholder = 'Type a message…',
                           enableReactions = true,
                           enableReply = true,
                           enableAvatars = true,
                           enableDivider = true,
                           enableCommandLogFilter = false,
                           chatDisabled = false,
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
            enableAvatars={enableAvatars}
            enableDivider={enableDivider}
            enableCommandLogFilter={enableCommandLogFilter}
            chatDisabled={chatDisabled}
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
                             enableAvatars = true,
                             enableDivider = true,
                             enableCommandLogFilter = false,
                             chatDisabled = false,
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
            enableAvatars={enableAvatars}
            enableDivider={enableDivider}
            enableCommandLogFilter={enableCommandLogFilter}
            chatDisabled={chatDisabled}
        />
    );
}

export function ChatPanel(props: ChatPanelProps) {
    return 'url' in props ? <LiveChatPanel {...props} /> : <ManualChatPanel {...props} />;
}
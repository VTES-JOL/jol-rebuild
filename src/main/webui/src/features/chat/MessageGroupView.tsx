import React from 'react';
import type {ReplySnapshot} from '@/features/chat/useWebSocket';
import { nameColorStyle, initials, avatarStyle } from '@/shared/utils/avatarUtils';
import { MessageLineView } from './MessageLineView';
import type {MessageGroup} from '@/features/chat/chatUtils';

export type { MessageGroup };

function Avatar({ name, showLine }: { name: string; showLine: boolean }) {
    return (
        <div className="flex flex-col items-center w-7 shrink-0 cursor-default">
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
                style={avatarStyle(name)}
            >
                {initials(name)}
            </div>
            {showLine && <div className="w-px flex-1 bg-white/5 mt-1" />}
        </div>
    );
}

interface MessageGroupViewProps {
    group: MessageGroup;
    showLine: boolean;
    currentUser: string;
    onReact: (messageId: number, emoji: string) => void;
    onReply: (snapshot: ReplySnapshot) => void;
    onJumpTo: (id: number) => void;
    disabled: boolean;
    enableReactions: boolean;
    enableReply: boolean;
}

export const MessageGroupView = React.memo(function MessageGroupView({
    group,
    showLine,
    currentUser,
    onReact,
    onReply,
    onJumpTo,
    disabled,
    enableReactions,
    enableReply,
}: MessageGroupViewProps) {
    return (
        <div className="flex gap-2.5 mb-2.5">
            <Avatar name={group.sender} showLine={showLine} />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-medium" style={nameColorStyle(group.sender)}>
                        {group.sender}
                    </span>
                    {group.shortTime && (
                        <span className="text-[10px] text-slate-300 cursor-default">{group.shortTime}</span>
                    )}
                </div>
                {group.lines.map((line, i) => (
                    <MessageLineView
                        key={line.id}
                        line={line}
                        sender={group.sender}
                        currentUser={currentUser}
                        onReact={onReact}
                        onReply={onReply}
                        onJumpTo={onJumpTo}
                        disabled={disabled}
                        enableReactions={enableReactions}
                        enableReply={enableReply}
                        isFirst={i === 0}
                    />
                ))}
            </div>
        </div>
    );
});
